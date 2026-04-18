import mongoose from 'mongoose';

import AppUtils from 'utils/app-utils';
import constants from 'utils/constants';

import { Country } from 'shared/models/country';
import { CountryDTO } from 'shared/dto/country-dto';
import LoggerService from 'shared/services/logger-service';

export default class CountryService {
    async findRecord(id: string, headers: any = null) {
        try {
            let country: any = await this.getCountryData({ _id: mongoose.mongo.ObjectId.createFromHexString(id) }, headers);

            if (country) {
                return new CountryDTO(country);
            } else {
                return null;
            }
        } catch (error: any) {
            LoggerService.log('error', { error: error, message: 'Cannot find country', location: 'country-serv => find' });
            throw error;
        }
    }

    async findOne(filter: any, headers: any) {
        try {
            let country: any = await this.getCountryData(filter, headers);

            if (country) {
                return new CountryDTO(country);
            } else {
                return null;
            }

        } catch (error: any) {
            LoggerService.log('error', { error: error, message: 'Cannot find country', location: 'country-serv => findOne' });
            throw error;
        }
    }

    async getCountryData(filter: any, headers: any) {
        const countries = await Country.aggregate([
            {
                $match: filter
            },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    code: 1,
                    is_verified: 1,
                    is_active: 1,
                    is_deleted: 1,
                    is_private: 1,
                    created_at: 1
                }
            }
        ]);

        return countries && countries.length > 0 ? countries[0] : null;
    }

    async store(data: any, headers: any) {
        let country: any = {};

        country.code = data.code;
        country.name = data.name;
        country.is_active = true;
        country.is_verified = false;
        country.created_at = new Date();
        country.unique_id = AppUtils.getUniqueId();

        try {
            let createdCountry = await Country.create(country);
            return {
                success: true,
                country: new CountryDTO(createdCountry)
            };
        } catch (error: any) {
            LoggerService.log('error', { error: error, message: 'Error in creating country:' + error ? JSON.stringify(error) : '-', 'location': 'country-sev => store' });
            throw error;
        }
    }

    async update(id: any, data: any, headers: any = null) {
        let country = await Country.findById({ _id: id });

        if (country) {
            let countryDataToUpdate: any = this.getUpdatedCountry(data);

            return await Country.updateOne({ _id: id }, countryDataToUpdate);
        } else {
            return null;
        }
    }

    getUpdatedCountry(data: any) {
        let countryDataToUpdate: any = {};

        if (data.hasOwnProperty('code')) countryDataToUpdate.code = data.code;
        if (data.hasOwnProperty('name')) countryDataToUpdate.name = data.name;

        if (data.hasOwnProperty('is_active')) countryDataToUpdate.is_active = data.is_active;
        if (data.hasOwnProperty('is_deleted')) countryDataToUpdate.is_deleted = data.is_deleted;

        return countryDataToUpdate;
    }

    async filterRecords(data: any, headers: any = null) {
        let where: any = { is_deleted: { $ne: true } };

        if (data.hasOwnProperty('is_active')) {
            where.is_active = data.is_active;
        } else {
            where.is_active = true;
        }

        if (data.hasOwnProperty('name')) where.name = data.name;

        let pageNumber = 1;
        let pageSize = constants.DEFAULT_PAGED_RECORDS;

        if (data.page_number) {
            pageNumber = data.page_number;
        }
        if (data.page_size) {
            pageSize = data.page_size;
        }

        const skip = (pageNumber - 1) * pageSize;

        let sort: any = { 'sort_order': 1 };
        if (data.latest) {
            sort = { 'created_at': -1 };
        }

        let countries = await Country.find(where)
            .sort(sort)
            .skip(skip)
            .limit(pageSize);

        let records = countries.map((country: any) => new CountryDTO(country));

        let total = await Country.countDocuments(where);

        return { total, records };
    }

    async remove(id: any, headers: any = null) {
        try {
            let country: any = await Country.findOne({ _id: id });
            if (country) {
                let result: any = await Country.updateOne({ _id: id }, { is_active: false, updated_at: new Date() });
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
            LoggerService.log('error', { error: error, message: 'Cannot remove country', location: 'country-serv => remove' });
            throw error;
        }
    }
}