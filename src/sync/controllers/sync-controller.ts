import { Request, Response } from 'express';

import constants from 'utils/constants';
import AuthMiddleware from 'middlewares/auth-middleware';
import LoggerService from 'shared/services/logger-service';
import BaseController from 'shared/controllers/base-controller';

import SyncService from 'sync/services/sync-service';
import { ResponseService } from 'shared/services/response-service';

export default class SyncController extends BaseController {
    private readonly service: SyncService;

    constructor() {
        super();

        this.service = new SyncService();
        this.setupRoutes();
    }

    public setupRoutes() {
        /**
         * @swagger
         * /api/v1/sync:
         *   post:
         *     tags:
         *       - Sync
         *     summary: Sync records.
         *     description: Sync offline records from app.
         *     requestBody:
         *       description: Sync offline records from app.
         *       required: true
         *       content:
         *           application/json:
         *             schema:
         *               type: object
         *               $ref: '#/components/schemas/SyncRequestSchema'
         *     responses:
         *       201:
         *         description: Records synced successfully.
         *       400:
         *         description: Bad request.
         *       500:
         *         description: Internal server error.
         *
         */
        this.router.post(constants.API.V1 + constants.API.SYNC, this.asyncHandler(AuthMiddleware.verifyJwt), (req: Request, res: Response) => {
            this.syncRecords(req, res);
        });
    }

    private async syncRecords(req: Request, res: Response) {
        try {
            let result: any = await this.service.sync(req.body, req.headers);
            ResponseService.sendResponse(req, res, result, null, 'Test created', constants.HTTP_STATUS.CREATED);
        } catch (error: any) {
            LoggerService.log('error', { error: error, message: 'Error in syncing tests', location: 'sync-controller => syncRecords', data: JSON.stringify(error) });
            ResponseService.sendResponse(req, res, null, error, 'Error in syncing tests');
        }
    }
}
