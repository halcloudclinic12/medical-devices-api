import mongoose from 'mongoose';

import AppUtils from 'utils/app-utils';
import constants from 'utils/constants';

import { City } from 'shared/models/city';
import StateService from './state-service';
import { CityDTO } from 'shared/dto/city-dto';
import LoggerService from 'shared/services/logger-service';

export default class CityService {
    private readonly stateService: StateService;

    constructor() {
        this.stateService = new StateService();
    }

    async findRecord(id: string, headers: any = null) {
        try {
            let city: any = await this.getCityData({ _id: mongoose.mongo.ObjectId.createFromHexString(id) }, headers);

            if (city) {
                return new CityDTO(city);
            } else {
                return null;
            }
        } catch (error: any) {
            LoggerService.log('error', { error: error, message: 'Cannot find city', location: 'city-serv => find' });
            throw error;
        }
    }

    async findOne(filter: any, headers: any) {
        try {
            let city: any = await this.getCityData(filter, headers);

            if (city) {
                return new CityDTO(city);
            } else {
                return null;
            }

        } catch (error: any) {
            LoggerService.log('error', { error: error, message: 'Cannot find city', location: 'city-serv => findOne' });
            throw error;
        }
    }

    async getCityData(filter: any, headers: any) {
        const cities = await City.aggregate([
            {
                $match: filter
            },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    code: 1,
                    state_id: 1,
                    country_id: 1,
                    state_name: 1,
                    is_verified: 1,
                    country_name: 1,
                    is_active: 1,
                    is_deleted: 1,
                    is_private: 1,
                    created_at: 1
                }
            }
        ]);

        return cities && cities.length > 0 ? cities[0] : null;
    }

    async store(data: any, headers: any) {
        let city: any = {};

        const state = await this.stateService.findOne({ _id: mongoose.mongo.ObjectId.createFromHexString(data.state_id) }, headers);
        if (!state) {
            throw new Error(constants.MESSAGES.ERRORS.STATE_NOT_FOUND);
        }

        city.code = data.code;
        city.name = data.name;
        city.is_active = true;
        city.is_verified = false;
        city.created_at = new Date();
        city.state_name = state.name;
        city.country_name = state.country_name;
        city.unique_id = AppUtils.getUniqueId();
        city.state_id = mongoose.mongo.ObjectId.createFromHexString(data.state_id);
        city.country_id = mongoose.mongo.ObjectId.createFromHexString(data.country_id);

        try {
            let createdCity = await City.create(city);
            return {
                success: true,
                city: new CityDTO(createdCity)
            };
        } catch (error: any) {
            LoggerService.log('error', { error: error, message: 'Error in creating city:' + error ? JSON.stringify(error) : '-', 'location': 'city-sev => store' });
            throw error;
        }
    }

    async update(id: any, data: any, headers: any = null) {
        let city = await City.findById({ _id: id });

        if (city) {
            let cityDataToUpdate: any = this.getUpdatedCity(data);

            return await City.updateOne({ _id: id }, cityDataToUpdate);
        } else {
            return null;
        }
    }

    getUpdatedCity(data: any) {
        let cityDataToUpdate: any = {};

        if (data.hasOwnProperty('code')) cityDataToUpdate.code = data.code;
        if (data.hasOwnProperty('name')) cityDataToUpdate.name = data.name;
        if (data.hasOwnProperty('state_id')) cityDataToUpdate.state_id = data.state_id;
        if (data.hasOwnProperty('country_id')) cityDataToUpdate.country_id = data.country_id;

        if (data.hasOwnProperty('is_active')) cityDataToUpdate.is_active = data.is_active;
        if (data.hasOwnProperty('is_deleted')) cityDataToUpdate.is_deleted = data.is_deleted;

        return cityDataToUpdate;
    }

    async filterRecords(data: any, headers: any = null) {
        let where: any = { is_deleted: { $ne: true } };

        if (data.hasOwnProperty('is_active')) {
            where.is_active = data.is_active;
        } else {
            where.is_active = true;
        }

        if (data.hasOwnProperty('state_id')) {
            where.state_id = mongoose.mongo.ObjectId.createFromHexString(data.state_id);
        }

        if (data.hasOwnProperty('country_id')) {
            where.country_id = mongoose.mongo.ObjectId.createFromHexString(data.country_id);
        }

        if (data.hasOwnProperty('name'))
            where.name = data.name;

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

        let cities = await City.find(where)
            .sort(sort)
            .skip(skip)
            .limit(pageSize);

        let records = cities.map((city: any) => new CityDTO(city));

        let total = await City.countDocuments(where);

        return { total, records };
    }

    async remove(id: any, headers: any = null) {
        try {
            let city: any = await City.findOne({ _id: id });
            if (city) {
                let result: any = await City.updateOne({ _id: id }, { is_active: false, updated_at: new Date() });
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
            LoggerService.log('error', { error: error, message: 'Cannot remove city', location: 'city-serv => remove' });
            throw error;
        }
    }
}