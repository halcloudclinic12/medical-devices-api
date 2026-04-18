import { Request, Response } from 'express';

import constants from 'utils/constants';
import StatusService from '../services/status-service';
import LoggerService from 'shared/services/logger-service';
import BaseController from 'shared/controllers/base-controller';

import { ResponseService } from 'shared/services/response-service';

export default class StatusController extends BaseController {
    private readonly statusService: StatusService;

    constructor() {
        super();

        this.statusService = new StatusService();
        this.setupRoutes();
    }

    public setupRoutes() {
        /**
         * @swagger
         * /api/v1/status:
         *   get:
         *     tags:
         *       - Status
         *     summary: Prints server status
         *     responses:
         *       200:
         *         description: Server running fine or not.
         *       500:
         *         description: Internal server error.
         *
         */
        this.router.get(constants.API.V1 + constants.API.STATUS, (req: Request, res: Response) => {
            this.getStatus(req, res, this);
        });
    }

    private async getStatus(req: Request, res: Response, that: any) {
        try {
            let result: any = await this.statusService.getStatus();
            ResponseService.sendResponse(req, res, result, null, result.message, constants.HTTP_STATUS.OK);
        } catch (error: any) {
            LoggerService.log('error', { error: error, message: 'Error in checking status', location: 'status-controller => getStatus' });
            ResponseService.sendResponse(req, res, null, error, 'Error in checking status');
        }
    }
}
