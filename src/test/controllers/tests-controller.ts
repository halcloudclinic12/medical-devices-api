import { Request, Response } from 'express';

import constants from 'utils/constants';
import AuthMiddleware from 'middlewares/auth-middleware';
import BaseController from 'shared/controllers/base-controller';

import TestService from 'test/services/test-service';
import LoggerService from 'shared/services/logger-service';
import { ResponseService } from 'shared/services/response-service';

export default class TestsController extends BaseController {
    private readonly service: TestService;

    constructor() {
        super();

        this.service = new TestService();
        this.setupRoutes();
    }

    public setupRoutes() {
        /**
         * @swagger
         * /api/v1/tests/timeline:
         *   get:
         *     tags:
         *       - Test
         *     summary: Get test timeline.
         *     description: Get test timeline.
         *     parameters:
         *       - in: query
         *         name: patient_id
         *         description: Patient ID to filter tests.
         *         schema:
         *           type: string
         *       - in: query
         *         name: clinic_id
         *         description: Clinic ID to filter tests.
         *         schema:
         *           type: string
         *       - in: query
         *         name: customer_id
         *         description: Customer ID to filter tests.
         *         schema:
         *           type: string
         *       - in: query
         *         name: page_number
         *         description: Page number for pagination.
         *         schema:
         *           type: integer
         *       - in: query
         *         name: page_size
         *         description: Number of records to return.
         *         schema:
         *           type: integer
         *     responses:
         *       201:
         *         description: User created successfully.
         *       500:
         *         description: Internal server error.
         *
         */
        this.router.get(constants.API.V1 + constants.API.TESTS + '/timeline', this.asyncHandler(AuthMiddleware.verifyJwt), (req: Request, res: Response) => {
            this.getTestTimeline(req, res);
        });

        /**
         * @swagger
         * /api/v1/tests/download-pdf:
         *   get:
         *     tags:
         *       - Test
         *     summary: Download test pdf.
         *     description: Download test pdf.
         *     parameters:
         *       - in: query
         *         name: test_id
         *         description: Test id.
         *         schema:
         *           type: string
         *       - in: query
         *         name: name
         *         description: Test name.
         *         schema:
         *           type: string
         *     responses:
         *       201:
         *         description: User created successfully.
         *       500:
         *         description: Internal server error.
         *
         */
        this.router.get(constants.API.V1 + constants.API.TESTS + '/download-pdf', this.asyncHandler(AuthMiddleware.verifyJwt), (req: Request, res: Response) => {
            this.downloadPdf(req, res);
        });

        /**
         * @swagger
         * /api/v1/tests/send-pdf:
         *   get:
         *     tags:
         *       - Test
         *     summary: Send pdf to person.
         *     description: Send pdf to person.
         *     parameters:
         *       - in: query
         *         name: test_id
         *         description: Test id.
         *         schema:
         *           type: string
         *       - in: query
         *         name: name
         *         description: Test name.
         *         schema:
         *           type: string
         *     responses:
         *       201:
         *         description: User created successfully.
         *       500:
         *         description: Internal server error.
         *
         */
        this.router.get(constants.API.V1 + constants.API.TESTS + '/send-pdf', this.asyncHandler(AuthMiddleware.verifyJwt), (req: Request, res: Response) => {
            this.sendPdf(req, res);
        });

        /**
         * @swagger
         * /api/v1/tests/{id}:
         *   get:
         *     tags:
         *       - Test
         *     summary: Get basic test details.
         *     description: Get basic test details.
         *     parameters:
         *       - in: path
         *         name: id
         *         required: true
         *         schema:
         *           type: string
         *           description: Id for test.
         *     responses:
         *       200:
         *         description: Successfully returns test details.
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               properties:
         *                 data:
         *                   $ref: '#/components/schemas/BasicTestDetailResponseSchema'
         *       500:
         *         description: Internal server error.
         */
        this.router.get(constants.API.V1 + constants.API.TESTS + '/:id', this.asyncHandler(AuthMiddleware.verifyJwt), (req: Request, res: Response) => {
            this.findRecord(req, res);
        });
    }

    private async getTestTimeline(req: Request, res: Response) {
        try {
            let result: any = await this.service.getTestTimeline(req.query, req.headers);
            ResponseService.sendResponse(req, res, result, null, result.message, constants.HTTP_STATUS.OK);
        } catch (error: any) {
            LoggerService.log('error', { error: error, message: 'Error in getting timeline', location: 'tests-controller => getTimeLine', data: JSON.stringify(error) });
            ResponseService.sendResponse(req, res, null, error, 'Error in getting timeline');
        }
    }

    private async downloadPdf(req: Request, res: Response) {
        try {
            let result: any = await this.service.downloadPdf(req.query, req.headers);

            if (result.success) {
                // Return PDF for download
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Length', result.pdfBuffer.length.toString());
                res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
                res.setHeader('Content-Disposition', `attachment; filename="${result.fileName}"`);

                // Use res.end() instead of res.send() to avoid body-parser interference
                res.end(result.pdfBuffer);
            } else {
                LoggerService.log('warn', { message: 'PDF generation failed', location: 'tests-controller => downloadPdf', data: result.message });
                ResponseService.sendResponse(req, res, result, null, result.message, constants.HTTP_STATUS.NOT_FOUND);
            }
        } catch (error: any) {
            LoggerService.log('error', { error: error, message: 'Error in downloading pdf', location: 'tests-controller => downloadPdf', data: JSON.stringify(error) });
            ResponseService.sendResponse(req, res, null, error, 'Error in downloading pdf');
        }
    }

    private async sendPdf(req: Request, res: Response) {
        try {
            let result: any = await this.service.sendPdf(req.query, req.headers);
            ResponseService.sendResponse(req, res, result, null, result.message, constants.HTTP_STATUS.OK);
        } catch (error: any) {
            LoggerService.log('error', { error: error, message: 'Error in sending pdf', location: 'tests-controller => sendPdf', data: JSON.stringify(error) });
            ResponseService.sendResponse(req, res, null, error, 'Error in sending pdf');
        }
    }

    private async findRecord(req: Request, res: Response) {
        try {
            let result: any = await this.service.findRecord(req.params.id, req.headers);
            if (result) {
                ResponseService.sendResponse(req, res, result, null, 'Test found', constants.HTTP_STATUS.OK);
            } else {
                ResponseService.sendResponse(req, res, null, null, 'Not found', constants.HTTP_STATUS.NOT_FOUND);
            }
        } catch (error: any) {
            LoggerService.log('error', { error: error, message: 'Error in finding basic test', location: 'basic-test-controller => find', data: JSON.stringify(error) });
            ResponseService.sendResponse(req, res, null, error, 'Error in finding basic test');
        }
    }
}
