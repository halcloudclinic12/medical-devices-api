import { Request, Response } from 'express';

import constants from 'utils/constants';
import LoggerService from 'shared/services/logger-service';
import BaseController from 'shared/controllers/base-controller';

import { ResponseService } from 'shared/services/response-service';

export default class HealthController extends BaseController {
    constructor() {
        super();
        this.setupRoutes();
    }

    public setupRoutes() {
        /**
         * @swagger
         * /health:
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
        this.router.get('/' + constants.API.HEALTH, (req: Request, res: Response) => {
            this.getHealth(req, res, this);
        });
    }

    private async getHealth(req: Request, res: Response, that: any) {
        try {
            ResponseService.sendResponse(req, res, { message: 'Server running' }, null, null, constants.HTTP_STATUS.OK);
        } catch (error: any) {
            LoggerService.log('error', { error: error, message: 'Error in checking health', location: 'status-controller => getHealth' });
            ResponseService.sendResponse(req, res, null, error, 'Error in checking health');
        }
    }
}
