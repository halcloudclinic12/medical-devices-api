import mongoose from 'mongoose';
import appConfig from './src/config/app-config.js';
import { Summary } from './src/summary/models/summary.js';

async function checkData() {
    try {
        await mongoose.connect(appConfig.DB_CONNECTION);
        console.log('✅ Connected to database\n');

        const summary = await Summary.findOne({ _id: 'global' }).lean();

        if (!summary) {
            console.log('❌ No summary data found!');
            return;
        }

        console.log('📊 FULL DATABASE SUMMARY:\n');
        console.log('Total Patients:', summary.patients.total);
        console.log('Total Tests:', summary.tests.total);

        console.log('\n=== GENDER BREAKDOWN ===');
        console.log('Male Patients:', summary.patients.gender?.male?.total || 0);
        console.log('Female Patients:', summary.patients.gender?.female?.total || 0);
        console.log('None/Other Patients:', summary.patients.gender?.none?.total || 0);
        console.log('Male Tests:', summary.tests.gender?.male?.total || 0);
        console.log('Female Tests:', summary.tests.gender?.female?.total || 0);
        console.log('None/Other Tests:', summary.tests.gender?.none?.total || 0);

        console.log('\n=== ALL GENDER KEYS ===');
        console.log('Patient genders:', Object.keys(summary.patients.gender || {}));
        console.log('Test genders:', Object.keys(summary.tests.gender || {}));

        console.log('\n=== MONTHLY PATIENT DATA ===');
        const patientMonthly = summary.patients.monthly || {};
        Object.keys(patientMonthly).sort().forEach(month => {
            console.log(`${month}: ${patientMonthly[month]} patients`);
        });

        console.log('\n=== MONTHLY TEST DATA ===');
        const testMonthly = summary.tests.monthly || {};
        Object.keys(testMonthly).sort().forEach(month => {
            console.log(`${month}: ${testMonthly[month]} tests`);
        });

        console.log('\n=== MALE MONTHLY DATA ===');
        const maleMonthly = summary.patients.gender?.male?.monthly || {};
        Object.keys(maleMonthly).sort().forEach(month => {
            console.log(`${month}: ${maleMonthly[month]} male patients`);
        });

        console.log('\n=== FEMALE MONTHLY DATA ===');
        const femaleMonthly = summary.patients.gender?.female?.monthly || {};
        Object.keys(femaleMonthly).sort().forEach(month => {
            console.log(`${month}: ${femaleMonthly[month]} female patients`);
        });

        console.log('\n' + '='.repeat(70));
        console.log('EXPECTED FOR OCT 1 - DEC 27, 2025:');
        console.log('='.repeat(70));
        console.log('Total Patients: 16 (Oct: 4, Nov: 4, Dec: 8)');
        console.log('Total Tests: 48');
        console.log('Male Patients: 8');
        console.log('Female Patients: 8');
        console.log('Customers: 3');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

checkData();
