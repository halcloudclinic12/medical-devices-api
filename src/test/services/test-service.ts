import ejs from 'ejs';
import fs from 'node:fs';
import path from 'node:path';
import mongoose, { Types } from 'mongoose';

import AppUtils from 'utils/app-utils';
import { User } from 'user/models/user';
import constants from 'utils/constants';
import appConfig from 'config/app-config';
import { Patient } from 'patient/models/patient';
import PdfService from 'shared/services/pdf-service';
import CityService from 'shared/services/city-service';
import EmailService from 'shared/services/email-service';
import { SmsService } from 'shared/services/sms-service';
import LoggerService from 'shared/services/logger-service';
import ClinicService from 'clinic/services/clinic-service';
import BadRequestError from 'shared/errors/bad-request-error';
import PatientService from 'patient/services/patient-service';
import SummaryService from 'summary/services/summary-service';
import { WhatsappService } from 'shared/services/whatsapp-service';
import { BasicTest, Hba1cTest, LipidTest, Test, TestType } from 'test/models/test';

export default class TestService {
    private readonly pdfService: PdfService;
    private readonly smsService: SmsService;
    private readonly cityService: CityService;
    private readonly emailService: EmailService;
    private readonly clinicService: ClinicService;
    private readonly patientService: PatientService;
    private readonly summaryService: SummaryService;
    private readonly whatsappService: WhatsappService;

    private readonly BASIC_FIELDS: string[] = [
        'height', 'height_result',
        'weight', 'weight_range', 'weight_result',
        'physique', 'physique_range', 'health_score',
        'temperature', 'temperature_result', 'temperature_range',
        'bilirubin', 'bilirubin_range', 'bilirubin_result',
        'blood_pressure_diastolic', 'blood_pressure_diastolic_range', 'blood_pressure_diastolic_result',
        'blood_pressure_systolic', 'blood_pressure_systolic_range', 'blood_pressure_systolic_result',
        'bmi', 'bmi_range', 'bmi_result',
        'bmr', 'bmr_range', 'bmr_result',
        'bone_mass', 'bone_mass_range', 'bone_mass_result',
        'skeletal_muscle', 'skeletal_muscle_range', 'skeletal_muscle_result',
        'body_fat', 'body_fat_range', 'body_fat_result',
        'fat_free_weight', 'fat_free_weight_result',
        'muscle_mass', 'muscle_mass_range', 'muscle_mass_result',
        'subcutaneous_fat', 'subcutaneous_fat_range', 'subcutaneous_fat_result',
        'visceral_fat', 'visceral_fat_range', 'visceral_fat_result',
        'body_water', 'body_water_range', 'body_water_result',
        'creatinine', 'creatinine_range', 'creatinine_result',
        'eye_left_result', 'eye_left_vision', 'eye_range', 'eye_right_result', 'eye_right_vision',
        'hemoglobin', 'hemoglobin_range', 'hemoglobin_result',
        'meta_age', 'meta_age_range', 'meta_age_result',
        'oxygen', 'oxygen_range', 'oxygen_result',
        'protein', 'protein_range', 'protein_result',
        'pulse', 'pulse_range', 'pulse_result',
        'sugar', 'sugar_result', 'sugar_range',
        'muscle_rate', 'muscle_rate_result', 'muscle_rate_range',
        'lean_body_weight', 'lean_body_weight_result', 'lean_body_weight_range',
        'fat_level', 'control_weight', 'created_at'
    ];

    private readonly HBA1C_FIELDS: string[] = [
        'hba1c', 'hba1c_result', 'created_at'
    ];

    private readonly LIPID_FIELDS: string[] = [
        'tc', 'tg', 'hdl', 'ldl', 'tc_hdl',
        'tc_result', 'tg_result', 'hdl_result', 'ldl_result', 'tc_hdl_result',
        'created_at'
    ];

    private readonly CONFIG = {
        BASIC: {
            Model: BasicTest,
            fields: () => this.BASIC_FIELDS,
            test_type: constants.TESTS.BASIC,
            pdfTitle: 'Basic Health Test Report',
            summaryFn: async (summaryService: SummaryService, patient: any) => summaryService.addBasicTest({ gender: patient.gender, date_of_birth: patient.date_of_birth })
        },
        HBA1C: {
            Model: Hba1cTest,
            fields: () => this.HBA1C_FIELDS,
            test_type: constants.TESTS.HBA1C,
            pdfTitle: 'Hba1c Health Test Report',
            summaryFn: async (summaryService: SummaryService, patient: any) => summaryService.addHba1cTest({ gender: patient.gender, date_of_birth: patient.date_of_birth })
        },
        LIPID: {
            Model: LipidTest,
            fields: () => this.LIPID_FIELDS,
            test_type: constants.TESTS.LIPID,
            pdfTitle: 'Lipid Health Test Report',
            summaryFn: async (summaryService: SummaryService, patient: any) => summaryService.addLipidTest({ gender: patient.gender, date_of_birth: patient.date_of_birth })
        }
    };

    constructor() {
        this.pdfService = new PdfService();
        this.smsService = new SmsService();
        this.cityService = new CityService();
        this.emailService = new EmailService();
        this.clinicService = new ClinicService();
        this.patientService = new PatientService();
        this.summaryService = new SummaryService();
        this.whatsappService = new WhatsappService();
    }

    async findRecord(id: string, headers: any = null) {
        try {
            let result: any = await this.getTestData({ _id: mongoose.mongo.ObjectId.createFromHexString(id) }, headers);

            if (result?.data?.length > 0) {
                return result.data[0];
            }
        } catch (error: any) {
            LoggerService.log('error', { error: error, message: 'Cannot get test data', location: 'basic-test-serv => find' });
            throw error;
        }
    }

    async findOne(filter: any, headers: any) {
        try {
            let result: any = await this.getTestData(filter, headers);

            return result?.data?.length > 0 ? result.data[0] : null;
        } catch (error: any) {
            LoggerService.log('error', { error: error, message: 'Cannot get basic data', location: 'basic-test-serv => findOne' });
            throw error;
        }
    }

    async store(data: any, headers: any = null) {
        // Validations
        if (!data || !data.test_type || !data.clinic_id || !data.patient_id) {
            throw new BadRequestError('Invalid data: missing test_type/clinic_id/patient_id');
        }

        const testType = String(data.test_type).toUpperCase() as TestType;
        if (!['BASIC', 'HBA1C', 'LIPID'].includes(testType)) {
            throw new BadRequestError(`Unsupported test_type: ${data.test_type}`);
        }
        if (!Types.ObjectId.isValid(data.clinic_id) || !Types.ObjectId.isValid(data.patient_id)) {
            throw new BadRequestError('Invalid ObjectId(s).');
        }

        // --- Load clinic & patient ---
        const clinicId = mongoose.Types.ObjectId.createFromHexString(data.clinic_id);
        const patientId = mongoose.Types.ObjectId.createFromHexString(data.patient_id);

        const clinic: any = await this.clinicService.findOne({ _id: clinicId }, null);
        if (!clinic) throw new Error('Clinic not found');

        const patient: any = await this.patientService.findOne({ _id: patientId }, null);
        if (!patient) throw new Error('Patient not found');

        const patientName = AppUtils.getPatientName(patient);

        // --- Whitelist payload by type ---
        const { Model, fields, test_type, pdfTitle, summaryFn } = this.CONFIG[testType];
        const allowed = fields();
        const body: any = {};

        for (const key of allowed) {
            if (Object.prototype.hasOwnProperty.call(data, key)) {
                body[key] = data[key];
            }
        }

        body.is_active = true;
        body.clinic_id = clinicId;
        body.test_type = test_type;
        body.patient_id = patientId;
        body.city_id = clinic.city_id;
        body.state_id = clinic.state_id;
        body.country_id = clinic.country_id;
        body.sync_id = data.sync_id ?? null;
        body.customer_id = clinic.customer_id;
        body.unique_id = AppUtils.getUniqueId();
        body.created_at = body.created_at ? new Date(body.created_at) : new Date();

        // Temp data
        body.patient_data = {
            name: patientName,
            email: patient.email ?? null,
            gender: patient.gender ?? null,
            mobile: patient.mobile ?? null
        };
        body.clinic_data = {
            name: clinic.name ?? null,
            code: clinic.code ?? null
        };

        // --- Write via discriminator for the chosen type ---
        let saved: any;
        try {
            saved = await Model.create(body);
        } catch (error: any) {
            if (error?.code === 11000) {
                // unique index violation on (customer/clinic/patient/test_type/unique_id), if you set it
                throw new BadRequestError('Duplicate test (unique constraint).');
            }
            LoggerService.log('error', { error, message: `Cannot create ${testType.toLowerCase()} test`, location: 'test-service => storeTest' });
            throw error;
        }

        // Write summary
        try {
            await summaryFn(this.summaryService, patient);
        } catch (err: any) {
            LoggerService.log('error', { error: err, message: `Cannot add ${testType.toLowerCase()} test summary`, location: 'test-service => storeTest.summary' });
        }

        // Generate PDF and send email asynchronously (non-blocking)
        setImmediate(async () => {
            try {
                await this.prepareAndSendPdf({
                    test_id: saved._id.toString(),
                    test_type: testType,
                    patient_id: patientId
                }, headers);
            } catch (err: any) {
                LoggerService.log('error', { error: err, message: `Cannot generate/send ${testType.toLowerCase()} test pdf`, location: 'test-service => storeTest.pdf' });
            }
        });

        return saved;
    }

    async getTestData(filter: any, headers: any) {
        const result = await Test.aggregate([
            {
                $match: filter
            },
            {
                $facet: {
                    total: [
                        { $count: "count" }
                    ],
                    data: [
                        {
                            $project: {
                                _id: 1,
                                city_id: 1,
                                state_id: 1,
                                clinic_id: 1,
                                country_id: 1,
                                patient_id: 1,
                                test_type: 1,
                                clinic_data: 1,
                                patient_data: 1,

                                // BASIC
                                height: 1, height_result: 1,
                                weight: 1, weight_range: 1, weight_result: 1,
                                physique: 1, physique_range: 1, health_score: 1,
                                temperature: 1, temperature_result: 1, temperature_range: 1,
                                bilirubin: 1, bilirubin_range: 1, bilirubin_result: 1,
                                blood_pressure_diastolic: 1, blood_pressure_diastolic_range: 1, blood_pressure_diastolic_result: 1,
                                blood_pressure_systolic: 1, blood_pressure_systolic_range: 1, blood_pressure_systolic_result: 1,
                                bmi: 1, bmi_range: 1, bmi_result: 1,
                                bmr: 1, bmr_range: 1, bmr_result: 1,
                                bone_mass: 1, bone_mass_range: 1, bone_mass_result: 1,
                                skeletal_muscle: 1, skeletal_muscle_range: 1, skeletal_muscle_result: 1,
                                body_fat: 1, body_fat_range: 1, body_fat_result: 1,
                                fat_free_weight: 1, fat_free_weight_result: 1,
                                muscle_mass: 1, muscle_mass_range: 1, muscle_mass_result: 1,
                                subcutaneous_fat: 1, subcutaneous_fat_range: 1, subcutaneous_fat_result: 1,
                                visceral_fat: 1, visceral_fat_range: 1, visceral_fat_result: 1,
                                body_water: 1, body_water_range: 1, body_water_result: 1,
                                creatinine: 1, creatinine_range: 1, creatinine_result: 1,
                                eye_left_result: 1, eye_left_vision: 1, eye_range: 1, eye_right_result: 1, eye_right_vision: 1,
                                hemoglobin: 1, hemoglobin_range: 1, hemoglobin_result: 1,
                                meta_age: 1, meta_age_range: 1, meta_age_result: 1,
                                oxygen: 1, oxygen_range: 1, oxygen_result: 1,
                                protein: 1, protein_range: 1, protein_result: 1,
                                pulse: 1, pulse_range: 1, pulse_result: 1,
                                sugar: 1, sugar_result: 1, sugar_range: 1,
                                muscle_rate: 1, muscle_rate_result: 1, muscle_rate_range: 1,
                                lean_body_weight: 1, lean_body_weight_result: 1, lean_body_weight_range: 1,
                                fat_level: 1, control_weight: 1, created_at: 1,
                                // HBA1C
                                hba1c: 1, hba1c_result: 1,
                                // LIPID
                                tc: 1, tg: 1, hdl: 1, ldl: 1, tc_hdl: 1,
                                tc_result: 1, tg_result: 1, hdl_result: 1, ldl_result: 1, tc_hdl_result: 1
                            }
                        }
                    ]
                }
            }
        ]);

        if (result?.length > 0 && result[0]?.data?.length > 0) {
            let testData = result[0];

            testData.data[0].city = await this.cityService.findOne({ _id: testData.data[0].city_id }, headers);
            testData.data[0].clinic = await this.clinicService.findOne({ _id: testData.data[0].clinic_id }, headers);

            return testData;
        } else {
            return null;
        }
    }

    async filterRecords(data: any, headers: any = null) {
        let where: any = {};

        if (data) {
            where.is_active = Object.hasOwnProperty('is_active') ? !!data.is_active : true;

            if (data?.test_type) where.test_type = data.test_type;
            if (data?.clinic_id && Types.ObjectId.isValid(data.clinic_id)) where.clinic_id = mongoose.mongo.ObjectId.createFromHexString(data.clinic_id);
            if (data?.patient_id && Types.ObjectId.isValid(data.patient_id)) where.patient_id = mongoose.mongo.ObjectId.createFromHexString(data.patient_id);
            if (data?.customer_id && Types.ObjectId.isValid(data.customer_id)) where.customer_id = mongoose.mongo.ObjectId.createFromHexString(data.customer_id);
        } else {
            where.is_active = true;
        }

        const pageNumber = Math.max(1, Number(data?.page_number) || 1);
        const pageSize = Math.max(1, Math.min(100, Number(data?.page_size) || constants.DEFAULT_PAGED_RECORDS));
        const skip = (pageNumber - 1) * pageSize;

        try {
            const result = await Test.aggregate([
                { $match: where },
                { $sort: { created_at: data.latest ? -1 : 1 } },
                {
                    $facet: {
                        total: [{ $count: "count" }],
                        data: [
                            { $skip: +skip },
                            { $limit: +pageSize },
                            {
                                $match: {
                                    ...(data.country_id ? { "clinic.country_id": mongoose.mongo.ObjectId.createFromHexString(data.country_id) } : {}),
                                    ...(data.state_id ? { "clinic.state_id": mongoose.mongo.ObjectId.createFromHexString(data.state_id) } : {}),
                                    ...(data.city_id ? { "clinic.city_id": mongoose.mongo.ObjectId.createFromHexString(data.city_id) } : {})
                                }
                            },
                            {
                                $project: {
                                    _id: 1,
                                    test_type: 1,
                                    created_at: 1,

                                    // BASIC
                                    height: 1, height_result: 1,
                                    weight: 1, weight_range: 1, weight_result: 1,
                                    physique: 1, physique_range: 1, health_score: 1,
                                    temperature: 1, temperature_result: 1, temperature_range: 1,
                                    bilirubin: 1, bilirubin_range: 1, bilirubin_result: 1,
                                    blood_pressure_diastolic: 1, blood_pressure_diastolic_range: 1, blood_pressure_diastolic_result: 1,
                                    blood_pressure_systolic: 1, blood_pressure_systolic_range: 1, blood_pressure_systolic_result: 1,
                                    bmi: 1, bmi_range: 1, bmi_result: 1,
                                    bmr: 1, bmr_range: 1, bmr_result: 1,
                                    bone_mass: 1, bone_mass_range: 1, bone_mass_result: 1,
                                    skeletal_muscle: 1, skeletal_muscle_range: 1, skeletal_muscle_result: 1,
                                    body_fat: 1, body_fat_range: 1, body_fat_result: 1,
                                    fat_free_weight: 1, fat_free_weight_result: 1,
                                    muscle_mass: 1, muscle_mass_range: 1, muscle_mass_result: 1,
                                    subcutaneous_fat: 1, subcutaneous_fat_range: 1, subcutaneous_fat_result: 1,
                                    visceral_fat: 1, visceral_fat_range: 1, visceral_fat_result: 1,
                                    body_water: 1, body_water_range: 1, body_water_result: 1,
                                    creatinine: 1, creatinine_range: 1, creatinine_result: 1,
                                    eye_left_result: 1, eye_left_vision: 1, eye_range: 1, eye_right_result: 1, eye_right_vision: 1,
                                    hemoglobin: 1, hemoglobin_range: 1, hemoglobin_result: 1,
                                    meta_age: 1, meta_age_range: 1, meta_age_result: 1,
                                    oxygen: 1, oxygen_range: 1, oxygen_result: 1,
                                    protein: 1, protein_range: 1, protein_result: 1,
                                    pulse: 1, pulse_range: 1, pulse_result: 1,
                                    sugar: 1, sugar_result: 1, sugar_range: 1,
                                    muscle_rate: 1, muscle_rate_result: 1, muscle_rate_range: 1,
                                    lean_body_weight: 1, lean_body_weight_result: 1, lean_body_weight_range: 1,
                                    fat_level: 1, control_weight: 1,

                                    // HBA1C
                                    hba1c: 1, hba1c_result: 1,

                                    // LIPID
                                    tc: 1, tg: 1, hdl: 1, ldl: 1, tc_hdl: 1,
                                    tc_result: 1, tg_result: 1, hdl_result: 1, ldl_result: 1, tc_hdl_result: 1
                                }
                            }
                        ]
                    }
                }
            ]);

            let records = result[0]?.data || [];
            let total = result[0]?.total[0]?.count || 0;

            return { total, records };
        } catch (error: any) {
            LoggerService.log('error', { error: error, message: 'Cannot filter tests', location: 'basic-test-serv => filter' });
            throw error;
        }
    }

    async remove(id: string, headers: any = null) {
        try {
            let test: any = await Test.findById({ _id: id });
            if (test) {
                await Test.updateOne(
                    { _id: id },
                    {
                        $set: {
                            is_active: false,
                            updated_at: new Date()
                        }
                    }
                );

                return { success: true, message: 'Record deactivated successfully' };
            } else {
                return null;
            }
        } catch (error: any) {
            LoggerService.log('error', { error: error, message: 'Cannot remove basic test', location: 'basic-test-serv => remove' });
            throw error;
        }
    }

    async getTestTimeline(data: any, headers: any = null) {
        const where: any = {
            is_active: data?.hasOwnProperty('is_active') ? !!data.is_active : true,
        };

        if (data?.clinic_id && Types.ObjectId.isValid(data.clinic_id)) where.clinic_id = mongoose.Types.ObjectId.createFromHexString(data.clinic_id);
        if (data?.patient_id && Types.ObjectId.isValid(data.patient_id)) where.patient_id = mongoose.Types.ObjectId.createFromHexString(data.patient_id);
        if (data?.customer_id && Types.ObjectId.isValid(data.customer_id)) where.customer_id = mongoose.Types.ObjectId.createFromHexString(data.customer_id);

        if (data?.test_type) where.test_type = String(data.test_type).toUpperCase();

        const pageSize = Math.max(1, Math.min(100, Number(data?.page_size) || 20));
        const pageNumber = Math.max(1, Number(data?.page_number) || 1);
        const skip = (pageNumber - 1) * pageSize;

        const sort = { created_at: -1, _id: -1 };

        const pipeline: any[] = [
            { $match: where },
            { $sort: sort },
            {
                $facet: {
                    data: [
                        { $skip: skip },
                        { $limit: pageSize },
                        {
                            $project: {
                                _id: 1,
                                test_type: 1,
                                created_at: 1,
                                clinic_id: 1,
                                patient_id: 1,
                                clinic_data: '$clinic_data',
                                patient_data: '$patient_data'
                            }
                        }
                    ],
                    total: [{ $count: 'count' }]
                }
            }
        ];

        try {
            const [res] = await Test.aggregate(pipeline).allowDiskUse(true);
            return { total: res?.total?.[0]?.count ?? 0, records: res?.data ?? [] };
        } catch (error: any) {
            LoggerService.log('error', { error, message: 'Cannot fetch timeline', location: 'test-service => getTestTimeline' });
            throw error;
        }
    }

    async prepareAndSendPdf(data: any, headers: any) {
        let patient: any = await Patient.findOne({ _id: data.patient_id });
        if (!patient) {
            return {
                success: false,
                message: constants.MESSAGES.ERRORS.INVALID_PATIENT
            };
        }

        if (!patient.email) {
            return {
                success: false,
                message: constants.MESSAGES.ERRORS.EMAIL_NOT_FOUND
            };
        }

        let { testType, testData } = await this.getPdfData(data);

        if (!testData) {
            return {
                success: false,
                message: constants.MESSAGES.ERRORS.NOT_FOUND
            };
        }

        let fileName = AppUtils.getUniqueId() + '-test.pdf';

        try {
            const html = await this.pdfService.getPdfContent({
                test: testData,
                title: testType,
                fileName: fileName,
                testType: testType,
                city: testData.city,
                clinic: testData.clinic,
                patient: testData.patient_data
            });

            let { pdfBuffer, pdfFilePath } = await this.pdfService.generatePdf({
                html: html,
                fileName: fileName,
                testType: testType
            });

            // Send email
            await this.emailService.sendEmail({
                email: patient.email,
                subject: `Your Report - ${testType}`,
                body: 'Please find the test report attached.',
                attachments: [
                    {
                        filename: fileName,
                        encoding: 'base64',
                        filePath: pdfFilePath,
                        content: pdfBuffer.toString('base64')
                    }
                ]
            });

            // SMS configuration
            const smsMessage = `Your report is ready: ${data.title}. Please check your email for the attachment.`;
            await this.smsService.send({
                mobile: patient.mobile,
                body: smsMessage
            });

            // WhatsApp configuration (assuming your WhatsApp API uses a similar structure)
            const whatsappMessage = `Your report is ready: ${data.title}. Please check your email for the attachment.`;
            await this.whatsappService.send({
                fileName: fileName,
                mobile: patient.mobile,
                text: whatsappMessage,
                reportUrl: testData.reportUrl
            });

            return {
                success: true,
                message: 'PDF sent successfully via Email, SMS, and WhatsApp.'
            };
        } catch (error: any) {
            LoggerService.log('error', { error: error, message: 'Error in sending PDF:', location: 'pdf-service => sendPdf' });
            throw error;
        }
    }

    async sendPdf(data: any, headers: any) {
        let user: any = await User.findOne({ _id: headers.loggeduserid });
        if (!user) {
            return {
                success: false,
                message: constants.MESSAGES.ERRORS.INVALID_AUTH_TOKEN
            };
        }

        let { testType, testData } = await this.getPdfData(data);

        if (!testData) {
            return {
                success: false,
                message: constants.MESSAGES.ERRORS.NOT_FOUND
            };
        }

        let fileName = AppUtils.getUniqueId() + '-test.pdf';

        try {
            const html = await this.pdfService.getPdfContent({
                test: testData,
                title: testType,
                fileName: fileName,
                testType: testType,
                city: testData.city,
                clinic: testData.clinic,
                patient: testData.patient_data
            });

            let { pdfBuffer, pdfFilePath } = await this.pdfService.generatePdf({
                html: html,
                testType: testType,
                fileName: fileName
            });

            // Send email
            await this.emailService.sendEmail({
                email: user.email,
                subject: `Your Report - ${testType}`,
                body: 'Please find the test report attached.',
                attachments: [
                    {
                        filename: fileName,
                        encoding: 'base64',
                        filePath: pdfFilePath,
                        content: pdfBuffer.toString('base64')
                    }
                ]
            });

            // SMS configuration
            const smsMessage = `Your report is ready: ${data.title}. Please check your email for the attachment.`;
            await this.smsService.send({
                mobile: user.mobile,
                body: smsMessage
            });

            // WhatsApp configuration (assuming your WhatsApp API uses a similar structure)
            const whatsappMessage = `Your report is ready: ${data.title}. Please check your email for the attachment.`;
            await this.whatsappService.send({
                fileName: fileName,
                mobile: user.mobile,
                text: whatsappMessage,
                reportUrl: testData.reportUrl
            });

            return {
                success: true,
                message: 'PDF sent successfully via Email, SMS, and WhatsApp.'
            };
        } catch (error: any) {
            LoggerService.log('error', { error: error, message: 'Error in sending PDF:', location: 'pdf-service => sendPdf' });
            throw error;
        }
    }

    async downloadPdf(data: any, headers: any) {
        let { testType, testData } = await this.getPdfData(data);

        if (!testData) {
            return {
                success: false,
                message: constants.MESSAGES.ERRORS.NOT_FOUND
            };
        }

        let fileName = AppUtils.getUniqueId() + '-test.pdf';

        try {
            const rootDir = path.resolve(appConfig.ROOT);
            const publicDir = path.join(rootDir, 'public');
            const imagePath = path.join(publicDir, 'images');
            const ejsFilePath = path.join(rootDir, 'views', 'pdfs', testType.toLowerCase() + '.ejs');

            // Verify files exist
            if (!fs.existsSync(ejsFilePath)) {
                throw new Error(`EJS template not found: ${ejsFilePath}`);
            }
            const logoPath = path.join(imagePath, 'logo.jpg');
            if (!fs.existsSync(logoPath)) {
                throw new Error(`Logo not found: ${logoPath}`);
            }

            const logo = fs.readFileSync(logoPath).toString('base64');

            let html: string = await ejs.renderFile(ejsFilePath,
                {
                    logo: logo,
                    test: testData,
                    title: data.title,
                    city: testData.city,
                    imagePath: imagePath,
                    clinic: testData.clinic_data,
                    patient: testData.patient_data,
                });

            // Generate the PDF        
            let result = await this.pdfService.generatePdf({
                html: html,
                testType: testType,
                fileName: fileName
            });
            LoggerService.log('info', { message: 'Result:' + result.pdfFilePath, location: 'pdf-service => generatePdf', data: 'Result:' + result.pdfFilePath });
            return {
                success: true,
                fileName: fileName,
                pdfBuffer: result.pdfBuffer
            };
        } catch (error: any) {
            LoggerService.log('error', { error: error, message: 'Error in creating pdf:' + error ? JSON.stringify(error) : '-', 'location': 'patient-sev => store' });
            throw error;
        }
    }

    async getPdfData(data: any) {
        let testData: any = null;
        let testType: string = null;

        if (data.test_type == constants.TESTS.BASIC) {
            testType = constants.TESTS.BASIC;
        }
        else if (data.test_type == constants.TESTS.HBA1C) {
            testType = constants.TESTS.HBA1C;
        }
        else if (data.test_type == constants.TESTS.LIPID) {
            testType = constants.TESTS.LIPID;
        }

        if (testType) {
            testData = await this.findRecord(data.test_id);
            testData.reportUrl = appConfig.SERVER_ROOT + '/' + constants.API.V1 + constants.API.REPORT_URL + '/' + testData.unique_id;
        }

        return { testType: testType, testData: testData };
    }
}