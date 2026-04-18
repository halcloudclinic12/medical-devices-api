import mongoose from 'mongoose';

import AppUtils from 'utils/app-utils';
import constants from 'utils/constants';

import { State } from 'shared/models/state';
import { StateDTO } from 'shared/dto/state-dto';
import LoggerService from 'shared/services/logger-service';
import CountryService from './country-service';

export default class StateService {
    private readonly countryService: CountryService;

    constructor() {
        this.countryService = new CountryService();
    }

    async findRecord(id: string, headers: any = null) {
        try {
            let state: any = await this.getStateData({ _id: mongoose.mongo.ObjectId.createFromHexString(id) }, headers);

            if (state) {
                return new StateDTO(state);
            } else {
                return null;
            }
        } catch (error: any) {
            LoggerService.log('error', { error: error, message: 'Cannot find state', location: 'state-serv => find' });
            throw error;
        }
    }

    async findOne(filter: any, headers: any) {
        try {
            let state: any = await this.getStateData(filter, headers);

            if (state) {
                return new StateDTO(state);
            } else {
                return null;
            }

        } catch (error: any) {
            LoggerService.log('error', { error: error, message: 'Cannot find state', location: 'state-serv => findOne' });
            throw error;
        }
    }

    async getStateData(filter: any, headers: any) {
        const states = await State.aggregate([
            {
                $match: filter
            },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    code: 1,
                    country: 1,
                    country_id: 1,
                    country_name: 1,
                    is_verified: 1,
                    is_active: 1,
                    is_deleted: 1,
                    is_private: 1,
                    created_at: 1
                }
            }
        ]);

        return states && states.length > 0 ? states[0] : null;
    }

    async store(data: any, headers: any) {
        let state: any = {};

        const country = await this.countryService.findOne({ _id: mongoose.mongo.ObjectId.createFromHexString(data.country_id) }, headers);
        if (!country) {
            throw new Error(constants.MESSAGES.ERRORS.COUNTRY_NOT_FOUND);
        }

        state.code = data.code;
        state.name = data.name;
        state.is_active = true;
        state.is_verified = false;
        state.created_at = new Date();
        state.country_name = country.name;
        state.unique_id = AppUtils.getUniqueId();
        state.country_id = mongoose.mongo.ObjectId.createFromHexString(data.country_id);

        try {
            let createdState = await State.create(state);
            return {
                success: true,
                state: new StateDTO(createdState)
            };
        } catch (error: any) {
            LoggerService.log('error', { error: error, message: 'Error in creating state:' + error ? JSON.stringify(error) : '-', 'location': 'state-sev => store' });
            throw error;
        }
    }

    async update(id: any, data: any, headers: any = null) {
        let state = await State.findById({ _id: id });

        if (state) {
            let stateDataToUpdate: any = this.getUpdatedState(data);

            return await State.updateOne({ _id: id }, stateDataToUpdate);
        } else {
            return null;
        }
    }

    getUpdatedState(data: any) {
        let stateDataToUpdate: any = {};

        if (data.hasOwnProperty('code')) stateDataToUpdate.code = data.code;
        if (data.hasOwnProperty('name')) stateDataToUpdate.name = data.name;
        if (data.hasOwnProperty('country_id')) stateDataToUpdate.country_id = data.country_id;

        if (data.hasOwnProperty('is_active')) stateDataToUpdate.is_active = data.is_active;
        if (data.hasOwnProperty('is_deleted')) stateDataToUpdate.is_deleted = data.is_deleted;

        return stateDataToUpdate;
    }

    async filterRecords(data: any, headers: any = null) {
        let where: any = { is_deleted: { $ne: true } };

        if (data.hasOwnProperty('is_active')) {
            where.is_active = data.is_active;
        } else {
            where.is_active = true;
        }

        if (data.hasOwnProperty('country_id')) {
            where.country_id = mongoose.mongo.ObjectId.createFromHexString(data.country_id);
        }

        if (data.hasOwnProperty('name')) {
            where.name = data.name;
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

        let sort: any = { 'sort_order': 1 };
        if (data.latest) {
            sort = { 'created_at': -1 };
        }

        let states = await State.find(where)
            .sort(sort)
            .skip(skip)
            .limit(pageSize);

        let records = states.map((state: any) => new StateDTO(state));

        let total = await State.countDocuments(where);

        return { total, records };
    }

    async remove(id: any, headers: any = null) {
        try {
            let state: any = await State.findOne({ _id: id });
            if (state) {
                let result: any = await State.updateOne({ _id: id }, { is_active: false, updated_at: new Date() });
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
            LoggerService.log('error', { error: error, message: 'Cannot remove state', location: 'state-serv => remove' });
            throw error;
        }
    }
}