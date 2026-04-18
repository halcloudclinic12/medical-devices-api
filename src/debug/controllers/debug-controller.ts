import { Request, Response } from 'express';

import constants from 'utils/constants';
import AuthMiddleware from 'middlewares/auth-middleware';
import LoggerService from 'shared/services/logger-service';
import BaseController from 'shared/controllers/base-controller';

import DebugService from 'debug/services/debug-service';
import { ResponseService } from 'shared/services/response-service';

export default class DebugController extends BaseController {
    private readonly debugService: DebugService;

    constructor() {
        super();

        this.debugService = new DebugService();
        this.setupRoutes();
    }

    public setupRoutes() {
        /**
         * @swagger
         * /api/v1/debug/pdf:
         *   post:
         *     tags:
         *       - Debug
         *     summary: Create a new pdf.
         *     description: Create a new debug.
         *     requestBody:
         *       description: Pdf data.
         *       required: true
         *       content:
         *           application/json:
         *             schema:
         *               type: object
         *               $ref: '#/components/schemas/DebugCreateRequestSchema'
         *     responses:
         *       201:
         *         description: Successfully returns created success.
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               properties:
         *                 success:
         *                   type: boolean
         *       500:
         *         description: Internal server error.
         *
         */
        this.router.post(constants.API.V1 + constants.API.DEBUG + '/pdf', this.asyncHandler(AuthMiddleware.verifyJwt), (req: Request, res: Response) => {
            this.createPdf(req, res);
        });
    }

    private async createPdf(req: Request, res: Response) {
        try {
            let result: any = await this.debugService.createPdf(req.body, req.headers);
            ResponseService.sendResponse(req, res, result, null, 'Pdf created', constants.HTTP_STATUS.CREATED);
        } catch (error: any) {
            LoggerService.log('error', { error: error, message: 'Error in creating pdf', location: 'debug-controller => createPdf', data: JSON.stringify(error) });
            ResponseService.sendResponse(req, res, null, error, 'Error in creating pdf');
        }
    }
}
