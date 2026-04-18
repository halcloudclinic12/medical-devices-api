import path from 'path';
import { exit } from 'process';
import mongoose from 'mongoose';

import AppUtils from 'utils/app-utils';
import constants from 'utils/constants';
import appConfig from 'config/app-config';

import FileService from 'shared/services/file-service';
import SummaryService from 'summary/services/summary-service';

import { User } from 'user/models/user';
import { City } from 'shared/models/city';
import { State } from 'shared/models/state';
import { Clinic } from 'clinic/models/clinic';
import { Country } from 'shared/models/country';
import { Patient } from 'patient/models/patient';
import { BasicTest, Hba1cTest, LipidTest } from 'test/models/test';

export default class SummaryTestSeeder {
    private fileService: FileService;
    private summaryService: SummaryService;

    private clinics: any[] = [];
    private customers: any[] = [];
    private scenarios: any[] = [];
    private lastNames: string[] = [];
    private maleNames: string[] = [];
    private femaleNames: string[] = [];
    private usedMobileNumbers = new Set<string>();

    constructor() {
        this.fileService = new FileService();
        this.summaryService = new SummaryService();
        this.loadSeedData();
    }

    private loadSeedData() {
        // Load names
        const namesPath = path.join(__dirname, './seed-data/summary-names.json');
        const namesContent = this.fileService.readFile(namesPath);
        if (namesContent) {
            const names = JSON.parse(namesContent.toString());
            this.maleNames = names.maleNames;
            this.femaleNames = names.femaleNames;
            this.lastNames = names.lastNames;
        }

        // Load customers
        const customersPath = path.join(__dirname, './seed-data/summary-customers.json');
        const customersContent = this.fileService.readFile(customersPath);
        if (customersContent) {
            this.customers = JSON.parse(customersContent.toString());
        }

        // Load clinics
        const clinicsPath = path.join(__dirname, './seed-data/summary-clinics.json');
        const clinicsContent = this.fileService.readFile(clinicsPath);
        if (clinicsContent) {
            this.clinics = JSON.parse(clinicsContent.toString());
        }

        // Load scenarios
        const scenariosPath = path.join(__dirname, './seed-data/summary-scenarios.json');
        const scenariosContent = this.fileService.readFile(scenariosPath);
        if (scenariosContent) {
            this.scenarios = JSON.parse(scenariosContent.toString());
        }
    }

    private getRandomName(gender: string): { firstName: string; lastName: string } {
        const firstNames = gender === 'male' ? this.maleNames : this.femaleNames;
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = this.lastNames[Math.floor(Math.random() * this.lastNames.length)];
        return { firstName, lastName };
    }

    private generateUniqueMobile(): string {
        let mobile: string;
        do {
            // Generate 10 digit number starting with 7, 8, or 9
            const firstDigit = Math.floor(Math.random() * 3) + 7; // 7, 8, or 9
            const remaining = Math.floor(Math.random() * 900000000) + 100000000; // 9 digits
            mobile = `${firstDigit}${remaining}`;
        } while (this.usedMobileNumbers.has(mobile));

        this.usedMobileNumbers.add(mobile);
        return mobile;
    }

    async seed() {
        try {
            await mongoose.connect(appConfig.DB_CONNECTION, {});
            console.log('✅ Connected to database');

            const location = await this.getOrCreateLocation();

            console.log('\n🌱 Starting to seed test data...\n');

            // Create 3 customers with distributed data
            const customers = await this.createCustomers(3);

            let totalPatients = 0;
            let totalTests = 0;

            for (let i = 0; i < customers.length; i++) {
                const customer = customers[i];
                console.log(`\n👤 Customer ${i + 1}: ${customer.first_name} ${customer.last_name}`);

                const clinic = await this.getOrCreateClinic(customer, location, i + 1);
                const stats = await this.generateTestData(customer, clinic, location, i);

                totalPatients += stats.patients;
                totalTests += stats.tests;
            }

            console.log('\n✅ Seed data generated successfully!');
            console.log(`\n📊 Grand Total:`);
            console.log(`   - Customers: ${customers.length}`);
            console.log(`   - Patients: ${totalPatients}`);
            console.log(`   - Total Tests: ${totalTests}`);
            console.log('\n📊 Check the summary by calling: GET /api/summary/data');

        } catch (error) {
            console.error('❌ Error seeding data:', error);
        } finally {
            await mongoose.disconnect();
            exit(0);
        }
    }

    async createCustomers(count: number) {
        const customersToCreate = [];
        const customerData = this.customers.slice(0, count);

        for (let i = 0; i < customerData.length; i++) {
            const custData = customerData[i];
            console.log(`Creating customer ${i + 1}: ${custData.firstName} ${custData.lastName}...`);

            const customer = await User.create({
                email: custData.email,
                first_name: custData.firstName,
                last_name: custData.lastName,
                user_type: constants.USER_TYPES.CUSTOMER,
                role_id: new mongoose.Types.ObjectId(),
                creator_user_id: new mongoose.Types.ObjectId(),
                password: 'test123',
                mobile: custData.phoneNumber,
                gender: 'male',
                is_active: true,
                is_customer: true,
                unique_id: AppUtils.getUniqueId(),
                created_at: new Date()
            });

            await this.summaryService.addCustomer();
            customersToCreate.push(customer);
        }

        return customersToCreate;
    }

    async getOrCreateLocation() {
        let country = await Country.findOne({ is_active: true });
        if (!country) {
            country = await Country.create({
                name: 'India',
                code: 'IN',
                is_active: true,
                unique_id: AppUtils.getUniqueId(),
                created_at: new Date()
            });
        }

        let state = await State.findOne({ country_id: country._id, is_active: true });
        if (!state) {
            state = await State.create({
                name: 'Maharashtra',
                code: 'MH',
                country_id: country._id,
                country_name: country.name,
                is_active: true,
                unique_id: AppUtils.getUniqueId(),
                created_at: new Date()
            });
        }

        let city = await City.findOne({ state_id: state._id, is_active: true });
        if (!city) {
            city = await City.create({
                name: 'Mumbai',
                code: 'MUM',
                state_id: state._id,
                state_name: state.name,
                country_id: country._id,
                country_name: country.name,
                is_active: true,
                unique_id: AppUtils.getUniqueId(),
                created_at: new Date()
            });
        }

        return { country, state, city };
    }

    async getOrCreateClinic(customer: any, location: any, clinicNumber: number) {
        const clinicData = this.clinics[clinicNumber - 1];

        console.log(`   Creating clinic: ${clinicData.name}...`);
        const clinic = await Clinic.create({
            name: clinicData.name,
            email: clinicData.email,
            phone_number: clinicData.phoneNumber,
            customer_id: customer._id,
            city_id: location.city._id,
            state_id: location.state._id,
            country_id: location.country._id,
            is_active: true,
            unique_id: AppUtils.getUniqueId(),
            created_at: new Date()
        });

        return clinic;
    }

    async generateTestData(customer: any, clinic: any, location: any, customerIndex: number) {
        const now = new Date();

        // Randomly assign each scenario to a customer instead of using modulo distribution
        // This creates more realistic variation in patient counts per customer
        const scenarios = this.scenarios.filter(() => {
            // Assign each scenario to this customer with 33% probability
            // This creates natural variation: some customers get more/fewer patients
            return Math.random() < 0.33;
        });

        // Ensure at least 2 patients per customer to avoid empty clinics
        if (scenarios.length === 0) {
            scenarios.push(this.scenarios[customerIndex * 2]);
            scenarios.push(this.scenarios[customerIndex * 2 + 1]);
        }

        for (const scenario of scenarios) {
            console.log(`\n📋 Generating: ${scenario.label}`);

            const patientDob = this.getDateOfBirthForAgeGroup(scenario.ageGroup);
            const testDate = new Date(now);
            testDate.setDate(testDate.getDate() + scenario.dateOffset);

            // Create patient
            const patient = await this.createPatient(
                customer,
                clinic,
                location,
                scenario.gender,
                patientDob,
                testDate
            );

            // Create all three types of tests for this patient
            await this.createBasicTest(customer, clinic, location, patient, testDate);
            await this.createHba1cTest(customer, clinic, location, patient, testDate);
            await this.createLipidTest(customer, clinic, location, patient, testDate);

            console.log(`      ✓ Patient created with 3 tests`);
        }

        console.log(`   📊 Subtotal:`);
        console.log(`      - Patients: ${scenarios.length}`);
        console.log(`      - Total Tests: ${scenarios.length * 3}`);

        return {
            patients: scenarios.length,
            tests: scenarios.length * 3
        };
    }

    getDateOfBirthForAgeGroup(ageGroup: string): Date {
        const now = new Date();
        let age: number;

        switch (ageGroup) {
            case '1-18':
                age = 10; // Mid-range
                break;
            case '19-40':
                age = 30;
                break;
            case '41-60':
                age = 50;
                break;
            case '61-120':
                age = 70;
                break;
            default:
                age = 30;
        }

        const dob = new Date(now);
        dob.setFullYear(dob.getFullYear() - age);
        return dob;
    }

    async createPatient(
        customer: any,
        clinic: any,
        location: any,
        gender: string,
        dateOfBirth: Date,
        createdAt: Date
    ) {
        const { firstName, lastName } = this.getRandomName(gender);
        const mobile = this.generateUniqueMobile();

        const patient = await Patient.create({
            first_name: firstName,
            last_name: lastName,
            email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${Date.now()}@test.com`,
            mobile: mobile,
            gender: gender,
            date_of_birth: dateOfBirth,
            customer_id: customer._id,
            clinic_id: clinic._id,
            city_id: location.city._id,
            state_id: location.state._id,
            country_id: location.country._id,
            is_active: true,
            is_verified: true,
            unique_id: AppUtils.getUniqueId(),
            created_at: createdAt
        });

        // Update summary
        await this.summaryService.addPatient({
            gender: patient.gender,
            date_of_birth: patient.date_of_birth,
            created_at: createdAt
        });

        return patient;
    }

    async createBasicTest(
        customer: any,
        clinic: any,
        location: any,
        patient: any,
        createdAt: Date
    ) {
        const test = await BasicTest.create({
            test_type: constants.TESTS.BASIC,
            patient_id: patient._id,
            clinic_id: clinic._id,
            customer_id: customer._id,
            city_id: location.city._id,
            state_id: location.state._id,
            country_id: location.country._id,

            // Sample basic test data
            height: '170',
            weight: '70',
            bmi: '24.2',
            temperature: '98.6',
            pulse: '72',
            oxygen: '98',

            patient_data: {
                name: `${patient.first_name} ${patient.last_name}`,
                email: patient.email,
                gender: patient.gender,
                mobile: patient.mobile
            },
            clinic_data: {
                name: clinic.name,
                code: clinic.clinic_id
            },

            is_active: true,
            unique_id: AppUtils.getUniqueId(),
            created_at: createdAt
        });

        // Update summary
        await this.summaryService.addBasicTest({
            gender: patient.gender,
            date_of_birth: patient.date_of_birth,
            created_at: createdAt
        });

        return test;
    }

    async createHba1cTest(
        customer: any,
        clinic: any,
        location: any,
        patient: any,
        createdAt: Date
    ) {
        const test = await Hba1cTest.create({
            test_type: constants.TESTS.HBA1C,
            patient_id: patient._id,
            clinic_id: clinic._id,
            customer_id: customer._id,
            city_id: location.city._id,
            state_id: location.state._id,
            country_id: location.country._id,

            // Sample hba1c data
            hba1c: '5.8',
            hba1c_result: 'Normal',

            patient_data: {
                name: `${patient.first_name} ${patient.last_name}`,
                email: patient.email,
                gender: patient.gender,
                mobile: patient.mobile
            },
            clinic_data: {
                name: clinic.name,
                code: clinic.clinic_id
            },

            is_active: true,
            unique_id: AppUtils.getUniqueId(),
            created_at: createdAt
        });

        // Update summary
        await this.summaryService.addHba1cTest({
            gender: patient.gender,
            date_of_birth: patient.date_of_birth,
            created_at: createdAt
        });

        return test;
    }

    async createLipidTest(
        customer: any,
        clinic: any,
        location: any,
        patient: any,
        createdAt: Date
    ) {
        const test = await LipidTest.create({
            test_type: constants.TESTS.LIPID,
            patient_id: patient._id,
            clinic_id: clinic._id,
            customer_id: customer._id,
            city_id: location.city._id,
            state_id: location.state._id,
            country_id: location.country._id,

            // Sample lipid data
            tc: '180',
            tg: '150',
            hdl: '50',
            ldl: '100',
            tc_hdl: '3.6',
            tc_result: 'Normal',
            tg_result: 'Normal',
            hdl_result: 'Normal',
            ldl_result: 'Normal',
            tc_hdl_result: 'Normal',

            patient_data: {
                name: `${patient.first_name} ${patient.last_name}`,
                email: patient.email,
                gender: patient.gender,
                mobile: patient.mobile
            },
            clinic_data: {
                name: clinic.name,
                code: clinic.clinic_id
            },

            is_active: true,
            unique_id: AppUtils.getUniqueId(),
            created_at: createdAt
        });

        // Update summary
        await this.summaryService.addLipidTest({
            gender: patient.gender,
            date_of_birth: patient.date_of_birth,
            created_at: createdAt
        });

        return test;
    }
}

// Run if called directly
if (require.main === module) {
    const seeder = new SummaryTestSeeder();
    seeder.seed();
}
