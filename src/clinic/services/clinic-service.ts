import mongoose from 'mongoose';

import AppUtils from 'utils/app-utils';
import constants from 'utils/constants';

import { Clinic } from 'clinic/models/clinic';
import { ClinicDTO } from 'clinic/dto/clinic-dto';
import CityService from 'shared/services/city-service';
import LoggerService from 'shared/services/logger-service';
import BadRequestError from 'shared/errors/bad-request-error';
import EncryptionService from 'shared/services/encryption-service';

export default class ClinicService {
    private readonly cityService: CityService;

    public constructor() {
        this.cityService = new CityService();
    }

    async findRecord(id: string, headers: any = null) {
        try {
            let clinic: any = await this.getClinicData({ _id: mongoose.mongo.ObjectId.createFromHexString(id) }, headers);

            if (clinic) {
                return new ClinicDTO(clinic);
            } else {
                return null;
            }
        } catch (error: any) {
            LoggerService.log('error', { error: error, message: 'Cannot find clinic', location: 'clinic-serv => find' });
            throw error;
        }
    }

    async findOne(filter: any, headers: any) {
        try {
            let clinic: any = await this.getClinicData(filter, headers);

            if (clinic) {
                return new ClinicDTO(clinic);
            } else {
                return null;
            }

        } catch (error: any) {
            LoggerService.log('error', { error: error, message: 'Cannot find clinic', location: 'clinic-serv => findOne' });
            throw error;
        }
    }

    async getClinicData(filter: any, headers: any) {
        const clinics = await Clinic.aggregate([
            {
                $match: filter
            },
            {
                $project: {
                    _id: 1,
                    city: 1,
                    name: 1,
                    email: 1,
                    address: 1,
                    city_id: 1,
                    location: 1,
                    state_id: 1,
                    clinic_id: 1,
                    is_active: 1,
                    country_id: 1,
                    customer_id: 1,
                    is_verified: 1,
                    phone_number: 1,
                    is_test_account: 1,
                    date_of_establishment: 1,
                }
            }
        ]);

        return clinics && clinics.length > 0 ? clinics[0] : null;
    }

    async store(data: any, headers: any) {
        let clinic: any = {};

        const city = await this.cityService.findOne({ _id: mongoose.mongo.ObjectId.createFromHexString(data.city_id) }, headers);
        if (!city) {
            throw new Error(constants.MESSAGES.ERRORS.CITY_NOT_FOUND);
        }

        // Check for duplicate clinic_id
        if (data.clinic_id && data.clinic_id.trim().length > 0) {
            const existingClinic = await Clinic.findOne({
                clinic_id: data.clinic_id.trim()
            });

            if (existingClinic) {
                throw new BadRequestError(constants.MESSAGES.ERRORS.CLINC_ID_ALREADY_USED);
            }
        }

        clinic.is_active = true;
        clinic.name = data.name;
        clinic.email = data.email;
        clinic.is_verified = true;
        clinic.address = data.address;
        clinic.created_at = new Date();
        clinic.clinic_id = data.clinic_id;
        clinic.is_active = data.is_active;
        clinic.phone_number = data.phone_number;
        clinic.unique_id = AppUtils.getUniqueId();
        clinic.is_test_account = data.is_test_account ?? false;
        clinic.date_of_establishment = data.date_of_establishment ?? null;
        clinic.password = EncryptionService.encryptWithBcrypt(data.password);
        clinic.city_id = mongoose.mongo.ObjectId.createFromHexString(data.city_id);
        clinic.state_id = mongoose.mongo.ObjectId.createFromHexString(data.state_id);
        clinic.country_id = mongoose.mongo.ObjectId.createFromHexString(data.country_id);
        clinic.customer_id = mongoose.mongo.ObjectId.createFromHexString(data.customer_id);

        clinic.location = {
            city_name: city.name,
            state_id: city.state_id,
            country_id: city.country_id,
            state_name: city.state_name,
            country_name: city.country_name,
            city_id: mongoose.mongo.ObjectId.createFromHexString(data.city_id),
        };

        try {
            let createdClinic = await Clinic.create(clinic);
            return {
                success: true,
                clinic: new ClinicDTO(createdClinic)
            };
        } catch (error: any) {
            LoggerService.log('error', { error: error, message: 'Error in creating clinic:' + error ? JSON.stringify(error) : '-', 'location': 'clinic-sev => store' });
            throw error;
        }
    }

    async update(id: any, data: any, headers: any = null) {
        let clinic = await Clinic.findById({ _id: id });

        if (clinic) {
            // Check for clinic_id uniqueness
            if (data.clinic_id && data.clinic_id.trim().length > 0) {
                const otherClinic = await Clinic.findOne({
                    clinic_id: data.clinic_id.trim(),
                    _id: { $ne: id }   // Exclude the current clinic from check
                });

                if (otherClinic) {
                    throw new BadRequestError(constants.MESSAGES.ERRORS.CLINC_ID_ALREADY_USED);
                }
            }

            let clinicDataToUpdate: any = this.getUpdatedClinic(data);

            if (data.hasOwnProperty('password') && data.password.trim().length > 0) {
                clinicDataToUpdate.password = EncryptionService.encryptWithBcrypt(data.password);
            }

            return await Clinic.updateOne({ _id: id }, clinicDataToUpdate);
        } else {
            return null;
        }
    }

    getUpdatedClinic(data: any) {
        let clinicDataToUpdate: any = {};

        if (data.hasOwnProperty('name')) clinicDataToUpdate.name = data.name;
        if (data.hasOwnProperty('email')) clinicDataToUpdate.email = data.email;
        if (data.hasOwnProperty('address')) clinicDataToUpdate.address = data.address;
        if (data.hasOwnProperty('city_id')) clinicDataToUpdate.city_id = data.city_id;
        if (data.hasOwnProperty('state_id')) clinicDataToUpdate.state_id = data.state_id;
        if (data.hasOwnProperty('clinic_id')) clinicDataToUpdate.clinic_id = data.clinic_id;
        if (data.hasOwnProperty('is_active')) clinicDataToUpdate.is_active = data.is_active;
        if (data.hasOwnProperty('country_id')) clinicDataToUpdate.country_id = data.country_id;
        if (data.hasOwnProperty('customer_id')) clinicDataToUpdate.customer_id = data.customer_id;
        if (data.hasOwnProperty('phone_number')) clinicDataToUpdate.phone_number = data.phone_number;
        if (data.hasOwnProperty('is_test_account')) clinicDataToUpdate.is_test_account = data.is_test_account;
        if (data.hasOwnProperty('date_of_establishment')) clinicDataToUpdate.date_of_establishment = data.date_of_establishment;

        return clinicDataToUpdate;
    }

    async filterRecords(data: any, headers: any = null) {
        let where: any = {};

        if (data.hasOwnProperty('is_active')) {
            where.is_active = data.is_active === 'true';
        } else {
            where.is_active = true;
        }

        if (data.hasOwnProperty('name')) {
            where.name = data.name;
        }

        if (data.hasOwnProperty('city_id')) {
            where.city_id = mongoose.Types.ObjectId.createFromHexString(data.city_id);
        }

        if (data.hasOwnProperty('state_id')) {
            where.state_id = mongoose.Types.ObjectId.createFromHexString(data.state_id);
        }

        if (data.hasOwnProperty('country_id')) {
            where.country_id = mongoose.Types.ObjectId.createFromHexString(data.country_id);
        }

        if (data.hasOwnProperty('customer_id')) {
            where.customer_id = mongoose.Types.ObjectId.createFromHexString(data.customer_id);
        }

        let pageNumber = 1;
        let pageSize = constants.DEFAULT_PAGED_RECORDS;

        if (data.page_number) {
            pageNumber = data.page_number;
        }
        if (data.page_size) {
            pageSize = data.page_size;
        }

        const skip = (pageNumber - 1) * pageSize;

        let sort: any = { 'name': 1 };
        if (data.latest) {
            sort = { 'created_at': -1 };
        }

        const clinics = await Clinic.aggregate([
            { $match: where },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    email: 1,
                    address: 1,
                    city_id: 1,
                    state_id: 1,
                    clinic_id: 1,
                    is_active: 1,
                    country_id: 1,
                    customer_id: 1,
                    is_verified: 1,
                    phone_number: 1,
                    is_test_account: 1,
                    date_of_establishment: 1,
                }
            },
            {
                $sort: sort
            },
            {
                $skip: +skip
            },
            {
                $limit: +pageSize
            }
        ]);

        let records = clinics.map((clinic: any) => new ClinicDTO(clinic));

        let total = await Clinic.countDocuments(where);

        return { total, records };
    }

    async remove(id: any, headers: any = null) {
        try {
            let clinic: any = await Clinic.findOne({ _id: id });
            if (clinic) {
                let result: any = await Clinic.updateOne({ _id: id }, { is_active: false, updated_at: new Date() });
                if (result.modifiedCount == 1) {
                    return {
                        success: true
                    };
                } else {
                    return {
                        success: false
                    };
                }
            } else {
                return null;
            }
        } catch (error: any) {
            LoggerService.log('error', { error: error, message: 'Cannot remove clinic', location: 'clinic-serv => remove' });
            throw error;
        }
    }
}