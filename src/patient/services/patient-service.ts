import mongoose from 'mongoose';
import { Patient } from 'patient/models/patient';

import config from 'config/app-config';
import AppUtils from 'utils/app-utils';
import constants from 'utils/constants';
import { IRole } from 'user/models/role';
import { PatientDTO } from 'patient/dto/patient-dto';
import BadRequestError from 'shared/errors/bad-request-error';

import AwsService from 'shared/services/aws-service';
import RoleService from 'user/services/role-service';
import ClinicService from 'clinic/services/clinic-service';
import LoggerService from 'shared/services/logger-service';
import SummaryService from 'summary/services/summary-service';
import EncryptionService from 'shared/services/encryption-service';

export default class PatientService {
    private readonly awsService: AwsService;
    private readonly roleService: RoleService;
    private readonly clinicService: ClinicService;
    private readonly summaryService: SummaryService;

    constructor() {
        this.awsService = new AwsService();
        this.roleService = new RoleService();
        this.clinicService = new ClinicService();
        this.summaryService = new SummaryService();
    }

    async findRecord(id: string, headers: any = null) {
        try {
            let patient: any = await this.getPatientData({ _id: mongoose.mongo.ObjectId.createFromHexString(id) }, headers);

            if (patient) {
                return new PatientDTO(patient);
            } else {
                return null;
            }
        } catch (error: any) {
            LoggerService.log('error', { error: error, message: 'Cannot find patient', location: 'patient-serv => find' });
            throw error;
        }
    }

    async findOne(filter: any, headers: any) {
        try {
            let patient: any = await this.getPatientData(filter, headers);

            if (patient) {
                return new PatientDTO(patient);
            } else {
                return null;
            }

        } catch (error: any) {
            LoggerService.log('error', { error: error, message: 'Cannot find patient', location: 'patient-serv => findOne' });
            throw error;
        }
    }

    async getPatientData(filter: any, headers: any) {
        const patients = await Patient.aggregate([
            {
                $match: filter
            },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    first_name: 1,
                    last_name: 1,
                    role_id: 1,
                    email: 1,
                    gender: 1,
                    mobile: 1,
                    is_active: 1,
                    is_deleted: 1,
                    is_private: 1,
                    created_at: 1,
                    image_file: 1,
                    app_version: 1,
                    blood_group: 1,
                    is_verified: 1,
                    date_of_birth: 1,
                    patient_token: 1
                }
            }
        ]);

        return patients && patients.length > 0 ? patients[0] : null;
    }

    async store(data: any, headers: any) {
        let clinic: any = await this.clinicService.findOne({ _id: mongoose.mongo.ObjectId.createFromHexString(data.clinic_id) }, null);
        if (!clinic) {
            throw new Error('Clinic not found');
        }

        let patient: any = {
            city_id: clinic.city_id,
            clinic_id: data.clinic_id,
            state_id: clinic.state_id,
            country_id: clinic.country_id,
            customer_id: clinic.customer_id,
        };

        let password;
        if (data.password) {
            password = data.password;
        } else {
            password = config.DEFAULT_USER_PASSWORD;
        }

        if (data.email) {
            patient.email = data.email;
            patient.username = data.email;
        }

        if (data.mobile) {
            patient.mobile = data.mobile;
            patient.username = data.mobile;
        }

        try {
            let result: any = await this.isDuplicatePatient(data.email, data.mobile, false);
            if (result.duplicate) {
                return {
                    success: false,
                    message: result.message
                };
            }
        } catch (error: any) {
            LoggerService.log('error', { error: error, message: 'Cannot check duplicate patient', location: 'patient-serv => store' });
            throw error;
        }

        let role: IRole = await this.roleService.findOne({ name: constants.ROLES.PATIENT });
        if (!role) {
            throw new Error('Patient role is not defined');
        }

        patient.is_active = true;
        patient.name = data.name;
        patient.is_verified = false;
        patient.created_at = new Date();
        patient.last_name = data.last_name;
        patient.gender = data.gender ?? null;
        patient.first_name = data.first_name;
        patient.unique_id = AppUtils.getUniqueId();
        patient.app_version = data.app_version ?? null;
        patient.blood_group = data.blood_group ?? null;
        patient.patient_token = data.patient_token ?? null;
        patient.password = EncryptionService.encryptWithBcrypt(password);
        patient.date_of_birth = data.date_of_birth ? new Date(data.date_of_birth) : null;

        if (data.image_file && config.AWS.S3_IMAGE_BUCKET) {
            let file_name = data.image.file_name;
            let mime_type = AppUtils.getMimeType(data.image.file_name);
            let saved_file_name = AppUtils.getUniqueFilename() + "_" + file_name;

            // Check if it's an SVG by matching against the MIME type
            const isSvg = data.image.base64.startsWith('data:image/svg+xml');
            let fileContent: Buffer;

            if (isSvg) {
                // For SVG, base64 should be decoded into a string (text-based)
                const base64Data = data.image.base64.replace(/^data:image\/svg\+xml;base64,/, '');
                fileContent = Buffer.from(base64Data, 'base64'); // Still using Buffer, but no binary data handling issues
            } else {
                // Handle other image formats as binary
                const base64Data = data.image.base64.replace(/^data:image\/\w+;base64,/, '');
                fileContent = Buffer.from(base64Data, 'base64');
            }

            let uploadResponse: any = await this.awsService.uploadFile('patient-image/' + saved_file_name, fileContent, config.AWS.S3_IMAGE_BUCKET, mime_type);

            if (uploadResponse) {
                patient.image_file = saved_file_name;
            } else {
                patient.image_file = constants.DEFAULTS.PATIENT_IMAGE;
            }
        }

        try {
            let createdPatient = await Patient.create(patient);

            try {
                await this.summaryService.addPatient({ gender: patient.gender, date_of_birth: patient.date_of_birth })
            } catch (error: any) {
                LoggerService.log('error', { error: error, message: 'Cannot add patient summary', location: 'patient-serv => store' });
                throw error;
            }

            return {
                success: true,
                patient: new PatientDTO(createdPatient)
            };
        } catch (error: any) {
            LoggerService.log('error', { error: error, message: 'Error in creating patient:' + error ? JSON.stringify(error) : '-', 'location': 'patient-sev => store' });
            throw error;
        }
    }

    async isDuplicatePatient(email: string, mobile: string, forUpdate: boolean, id: any = null) {
        email = email?.trim() || null;
        mobile = mobile?.trim() || null;

        // Build query conditions
        const conditions: any[] = [];

        if (email) conditions.push({ email });
        if (mobile) conditions.push({ mobile });

        // No email or mobile provided → nothing to check
        if (conditions.length === 0) {
            return { duplicate: false };
        }

        // Build base query
        const where: any = { $or: conditions };
        if (forUpdate && id) {
            where._id = { $ne: id };
        }

        const patient = await Patient.findOne(where);

        if (!patient) { return { duplicate: false }; }

        if (email && patient.email === email) {
            return { duplicate: true, message: 'Duplicate email' };
        }
        if (mobile && patient.mobile === mobile) {
            return { duplicate: true, message: 'Duplicate mobile' };
        }

        // Fallback case (should not reach here)
        return { duplicate: true, message: 'Duplicate record' };
    }

    async resetPassword(data: any, headers: any) {
        try {
            let patient: any = await this.findOne({ _id: mongoose.mongo.ObjectId.createFromHexString(data.id) }, headers);
            if (patient) {
                if (EncryptionService.verifyWithBcrypt(data.old_password, patient.password)) {
                    await this.update(data.id, { password: data.new_password });
                    return {
                        success: true
                    };
                } else {
                    return {
                        success: false,
                        message: constants.MESSAGES.ERRORS.OLD_PASSWORD_MISMATCH
                    };
                }
            } else {
                return {
                    success: false,
                    message: constants.MESSAGES.ERRORS.NOT_FOUND
                };
            }
        } catch (error: any) {
            LoggerService.log('error', { error: error, message: 'Error in reset password', 'location': 'patient-sev => resetPassword' });
            throw error;
        }
    }

    async update(id: any, data: any, headers: any = null) {
        let userId = mongoose.mongo.ObjectId.createFromHexString(id);
        let patient = await Patient.findById({ _id: userId });

        if (patient) {
            let patientDataToUpdate: any = this.getUpdatedPatient(data);

            if (data.hasOwnProperty('password')) {
                patientDataToUpdate.password = EncryptionService.encryptWithBcrypt(data.password);
            }

            let result: any = await this.isDuplicatePatient(data.email, data.mobile, true, id);
            if (result.duplicate) {
                return {
                    success: false,
                    message: result.message
                };
            }

            result = await Patient.updateOne({ _id: userId }, patientDataToUpdate);
            if (result && result.modifiedCount == 1) {
                return {
                    success: true,
                    patient: new PatientDTO(await this.findRecord(id, headers))
                };
            } else {
                return {
                    success: false,
                    message: constants.MESSAGES.NO_RECORD_UPDATED,
                    patient: new PatientDTO(await this.findRecord(id, headers))
                }
            }
        } else {
            return null;
        }
    }

    getUpdatedPatient(data: any) {
        let patientDataToUpdate: any = {};

        if (data.hasOwnProperty('pin')) patientDataToUpdate.pin = data.pin;
        if (data.hasOwnProperty('name')) patientDataToUpdate.name = data.name;
        if (data.hasOwnProperty('email')) patientDataToUpdate.email = data.email;
        if (data.hasOwnProperty('phone')) patientDataToUpdate.mobile = data.mobile;
        if (data.hasOwnProperty('gender')) patientDataToUpdate.gender = data.gender;
        if (data.hasOwnProperty('role_id')) patientDataToUpdate.role_id = data.role_id;
        if (data.hasOwnProperty('fcm_token')) patientDataToUpdate.fcm_token = data.fcm_token;
        if (data.hasOwnProperty('last_name')) patientDataToUpdate.last_name = data.last_name;
        if (data.hasOwnProperty('first_name')) patientDataToUpdate.first_name = data.first_name;
        if (data.hasOwnProperty('blood_group')) patientDataToUpdate.blood_group = data.blood_group;
        if (data.hasOwnProperty('patient_type')) patientDataToUpdate.patient_type = data.patient_type;
        if (data.hasOwnProperty('date_of_birth')) patientDataToUpdate.date_of_birth = data.date_of_birth;
        if (data.hasOwnProperty('is_test_account')) patientDataToUpdate.is_test_account = data.is_test_account;

        if (data.hasOwnProperty('is_active')) patientDataToUpdate.is_active = data.is_active;
        if (data.hasOwnProperty('is_deleted')) patientDataToUpdate.is_deleted = data.is_deleted;

        return patientDataToUpdate;
    }

    async updateImage(data: any, headers: any = null) {
        if (!config.AWS.S3_IMAGE_BUCKET) {
            throw new Error('S3 bucket not defined');
        }

        if (!data.image) {
            throw new BadRequestError('Image not provided');
        }

        let patient: any = Patient.findById({ _id: headers.loggedpatientid });

        if (patient) {
            if (data.image) {
                let file_name = data.image.file_name;
                let mime_type = AppUtils.getMimeType(data.image.file_name);
                let saved_file_name = AppUtils.getUniqueFilename() + "_" + file_name;

                // Check if it's an SVG by matching against the MIME type
                const isSvg = data.image.base64.startsWith('data:image/svg+xml');
                let fileContent: Buffer;

                if (isSvg) {
                    // For SVG, base64 should be decoded into a string (text-based)
                    const base64Data = data.image.base64.replace(/^data:image\/svg\+xml;base64,/, '');
                    fileContent = Buffer.from(base64Data, 'base64'); // Still using Buffer, but no binary data handling issues
                } else {
                    // Handle other image formats as binary
                    const base64Data = data.image.base64.replace(/^data:image\/\w+;base64,/, '');
                    fileContent = Buffer.from(base64Data, 'base64');
                }

                let uploadResponse: any = await this.awsService.uploadFile('patient-image/' + saved_file_name, fileContent, config.AWS.S3_IMAGE_BUCKET, mime_type);

                if (uploadResponse) {
                    try {
                        await Patient.updateOne({ _id: headers.loggedpatientid }, { image_file: saved_file_name });
                        return {
                            success: true
                        };
                    } catch (error: any) {
                        LoggerService.log('error', { error: error, message: 'Error in adding patient image', 'location': 'patient-sev => updateImage' });
                        throw error;
                    }
                } else {
                    return {
                        error: true,
                        success: false,
                        message: 'Could not upload image to storage'
                    };
                }
            } else {
                return {
                    error: true,
                    success: false,
                    message: 'Image not provided'
                };
            }
        } else {
            return null;
        }
    }

    async filterRecords(data: any, headers: any = null) {
        let where: any = {};

        if (data.name && data.name.trim().length > 0) where.name = data.name;
        if (data.email && data.email.trim().length > 0) where.email = data.email;
        if (data.mobile && data.mobile.trim().length > 0) where.mobile = data.mobile;
        if (data.gender && data.gender.trim().length > 0) where.gender = data.gender;
        if (data.is_active !== undefined && data.is_active !== null && data.is_active !== '') where.is_active = data.is_active;
        if (data.last_name && data.last_name.trim().length > 0) where.last_name = data.last_name;
        if (data.age_group && data.age_group.trim().length > 0) where.age_group = data.age_group;
        if (data.first_name && data.first_name.trim().length > 0) where.first_name = data.first_name;
        if (data.app_version && data.app_version.trim().length > 0) where.app_version = data.app_version;
        if (data.blood_group && data.blood_group.trim().length > 0) where.blood_group = data.blood_group;
        if (data.patient_token && data.patient_token.trim().length > 0) where.patient_token = data.patient_token;
        if (data.city_id && data.city_id.trim().length > 0) where.city_id = mongoose.mongo.ObjectId.createFromHexString(data.city_id);
        if (data.state_id && data.state_id.trim().length > 0) where.state_id = mongoose.mongo.ObjectId.createFromHexString(data.state_id);
        if (data.clinic_id && data.clinic_id.trim().length > 0) where.clinic_id = mongoose.mongo.ObjectId.createFromHexString(data.clinic_id);
        if (data.country_id && data.country_id.trim().length > 0) where.country_id = mongoose.mongo.ObjectId.createFromHexString(data.country_id);
        if (data.customer_id && data.customer_id.trim().length > 0) where.customer_id = mongoose.mongo.ObjectId.createFromHexString(data.customer_id);

        // Handle date range filter
        if (data.start_date || data.end_date) {
            where.created_at = {};
            if (data.start_date) {
                // Parse as UTC: YYYY-MM-DD -> YYYY-MM-DDT00:00:00.000Z
                const startDate = new Date(data.start_date + 'T00:00:00.000Z');
                where.created_at.$gte = startDate;
            }
            if (data.end_date) {
                // Parse as UTC and set to end of day: YYYY-MM-DDT23:59:59.999Z
                const endDate = new Date(data.end_date + 'T23:59:59.999Z');
                where.created_at.$lte = endDate;
            }
        }

        // ✅ Handle search across multiple fields
        if (data.search) {
            const searchRegex = new RegExp(data.search, 'i'); // Case-insensitive search
            where.$or = [
                { name: searchRegex },
                { name: searchRegex },
                { email: searchRegex },
                { mobile: searchRegex }
            ];
        }

        let pageNumber = data.page_number || 1;
        let pageSize = data.page_size || constants.DEFAULT_PAGED_RECORDS;

        const skip = (pageNumber - 1) * pageSize;

        let sort: any = { 'created_at': -1 };

        // Fetch Patients
        let patients = await Patient.find(where)
            .sort(sort)
            .skip(skip)
            .limit(pageSize);

        let records = patients.map((patient: any) => new PatientDTO(patient));

        let total = await Patient.countDocuments(where);

        return { total, records };
    }

    async remove(id: any, headers: any = null) {
        try {
            let patient: any = await Patient.findOne({ _id: id });
            if (patient) {
                if (patient.is_deleted) {
                    return {
                        success: false,
                        message: constants.MESSAGES.ALREADY_REMOVED
                    };
                } else {
                    let result: any = await Patient.updateOne({ _id: id }, { is_active: false, updated_at: new Date() });
                    if (result.modifiedCount == 1) {
                        return {
                            success: true
                        };
                    } else {
                        return {
                            success: false
                        };
                    }
                }
            } else {
                return null;
            }
        } catch (error: any) {
            LoggerService.log('error', { error: error, message: 'Cannot remove patient', location: 'patient-serv => remove' });
            throw error;
        }
    }
}