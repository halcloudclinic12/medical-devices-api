import mongoose from 'mongoose';

import AppUtils from 'utils/app-utils';
import constants from 'utils/constants';

import { Parameter } from '../models/parameter';
import LoggerService from 'shared/services/logger-service';

export default class ParameterService {
    async findRecord(id: string, headers: any = null) {
        try {
            return await this.getParameterData({ _id: mongoose.mongo.ObjectId.createFromHexString(id) }, headers);
        } catch (error: any) {
            LoggerService.log('error', { error: error, message: 'Cannot find parameter', location: 'parameter-serv => find' });
            throw error;
        }
    }

    async findOne(filter: any, headers: any) {
        try {
            return await this.getParameterData(filter, headers);
        } catch (error: any) {
            LoggerService.log('error', { error: error, message: 'Cannot find parameter', location: 'parameter-serv => findOne' });
            throw error;
        }
    }

    async getParameterData(filter: any, headers: any) {
        const parameters = await Parameter.aggregate([
            {
                $match: filter
            },
            {
                $project: {
                    _id: 1,
                    min: 1,
                    max: 1,
                    name: 1,
                    unit: 1,
                    label: 1,
                    ranges: 1,
                    is_active: 1,
                    test_type: 1,
                    created_at: 1
                }
            }
        ]);

        return parameters && parameters.length > 0 ? parameters[0] : null;
    }

    async store(data: any, headers: any) {
        let parameter: any = {};

        parameter.is_active = true;
        parameter.name = data.name;
        parameter.unit = data.unit;
        parameter.label = data.label;
        parameter.created_at = new Date();
        parameter.test_type = data.test_type;
        parameter.unique_id = AppUtils.getUniqueId();

        try {
            let createdParameter = await Parameter.create(parameter);
            return {
                success: true,
                parameter: createdParameter
            };
        } catch (error: any) {
            LoggerService.log('error', { error: error, message: 'Error in creating parameter:' + error ? JSON.stringify(error) : '-', 'location': 'parameter-sev => store' });
            throw error;
        }
    }

    async update(id: any, data: any, headers: any = null) {
        let parameter = await Parameter.findById({ _id: id });

        if (parameter) {
            let parameterDataToUpdate: any = this.getUpdatedParameter(data);

            return await Parameter.updateOne({ _id: mongoose.mongo.ObjectId.createFromHexString(id) }, parameterDataToUpdate);
        } else {
            return null;
        }
    }

    getUpdatedParameter(data: any) {
        let parameterDataToUpdate: any = {};

        if (data.hasOwnProperty('name')) parameterDataToUpdate.name = data.name;
        if (data.hasOwnProperty('unit')) parameterDataToUpdate.unit = data.unit;
        if (data.hasOwnProperty('label')) parameterDataToUpdate.label = data.label;
        if (data.hasOwnProperty('ranges')) parameterDataToUpdate.ranges = data.ranges;
        if (data.hasOwnProperty('test_type')) parameterDataToUpdate.test_name = data.test_type;
        if (data.hasOwnProperty('is_active')) parameterDataToUpdate.is_active = data.is_active;
        if (data.hasOwnProperty('sort_order')) parameterDataToUpdate.sort_order = data.sort_order;
        if (data.hasOwnProperty('is_deleted')) parameterDataToUpdate.is_deleted = data.is_deleted;

        return parameterDataToUpdate;
    }

    async filterRecords(data: any, headers: any = null) {
        let where: any = {};

        if (data.hasOwnProperty('is_active')) {
            where.is_active = data.is_active;
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

        let records: any = await Parameter.find(where)
            .sort(sort)
            .skip(skip)
            .limit(pageSize);

        let total = await Parameter.countDocuments(where);

        return { total, records };
    }

    async remove(id: any, headers: any = null) {
        try {
            let parameter: any = await Parameter.findOne({ _id: id });
            if (parameter) {
                if (parameter.is_deleted) {
                    return {
                        success: false,
                        message: constants.MESSAGES.ALREADY_REMOVED
                    };
                } else {
                    let result: any = await Parameter.updateOne({ _id: id }, { is_active: false, updated_at: new Date() });
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
            LoggerService.log('error', { error: error, message: 'Cannot remove parameter', location: 'parameter-serv => remove' });
            throw error;
        }
    }
}