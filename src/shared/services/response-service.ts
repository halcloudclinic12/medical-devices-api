import express from 'express';
import { Request, Response } from 'express';

import constants from 'utils/constants';
import LoggerService from './logger-service';
import { ApiResponse } from 'shared/dto/api-response';
import BadRequestError from 'shared/errors/bad-request-error';

export class ResponseService {
    static sendResponse(req: Request, res: Response, data: any = null, error: Error = null, message: string, statusCode: any = constants.HTTP_STATUS.OK) {
        ResponseService.logRequests(req);

        if (error) {
            let serializedError = {
                message: error.message
            };

            if (error instanceof BadRequestError) {
                res.status(constants.HTTP_STATUS.BAD_REQUEST).send(ApiResponse.prepare(null, message, serializedError, false));
            } else {
                res.status(constants.HTTP_STATUS.INTERNAL_SERVER_ERROR).send(ApiResponse.prepare(null, message, serializedError, false));
            }
        } else {
            res.status(statusCode).send(ApiResponse.prepare(data, message, null, false));
        }
    }

    /**
     * @function logRequests
     * @description Logs requests
     * @param controllers 
     */
    static logRequests(req: express.Request) {
        let data: any = {};
        data.url = req.url;
        data.request_method = req.method;

        data.startTime = req.headers.startTime;
        data.endTime = new Date();

        if (req.body && Object.keys(req.body.length > 0)) {
            data = Object.assign(data, req.body);
        }

        data.apiTime = (new Date(data.endTime).getTime() - new Date(data.startTime).getTime()) / 1000 + ' seconds';

        LoggerService.log('debug', { data: data });
    }
}