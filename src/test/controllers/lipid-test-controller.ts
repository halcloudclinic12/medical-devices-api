import { Request, Response } from 'express';

import constants from 'utils/constants';
import AuthMiddleware from 'middlewares/auth-middleware';
import LoggerService from 'shared/services/logger-service';
import BaseController from 'shared/controllers/base-controller';

import TestService from 'test/services/test-service';
import { ResponseService } from 'shared/services/response-service';

export default class LipidTestController extends BaseController {
    private readonly service: TestService;

    constructor() {
        super();

        this.service = new TestService();
        this.setupRoutes();
    }

    public setupRoutes() {
        /**
         * @swagger
         * /api/v1/test/lipid:
         *   post:
         *     tags:
         *       - Test
         *     summary: Create a new lipid test.
         *     description: Create a new lipid test.
         *     requestBody:
         *       description: Create a new lipid test.
         *       required: true
         *       content:
         *           application/json:
         *             schema:
         *               type: object
         *               $ref: '#/components/schemas/LipidTestCreateRequestSchema'
         *     responses:
         *       201:
         *         description: Test created successfully.
         *       500:
         *         description: Internal server error.
         *
         */
        this.router.post(constants.API.V1 + constants.API.TEST + constants.API.LIPID, this.asyncHandler(AuthMiddleware.verifyJwt), (req: Request, res: Response) => {
            this.createRecord(req, res);
        });

        /**
         * @swagger
         * /api/v1/test/lipid/{id}:
         *   get:
         *     tags:
         *       - Test
         *     summary: Get lipid test details.
         *     description: Get lipid test details.
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
         *                   $ref: '#/components/schemas/LipidTestDetailResponseSchema'
         *       500:
         *         description: Internal server error.
         */
        this.router.get(constants.API.V1 + constants.API.TEST + constants.API.LIPID + '/:id', this.asyncHandler(AuthMiddleware.verifyJwt), (req: Request, res: Response) => {
            this.findRecord(req, res);
        });

        /**
         * @swagger
         * /api/v1/test/lipid/{id}:
         *   delete:
         *     tags:
         *       - Test
         *     summary: Delete a resource
         *     description: Remove an existing lipid test by ID.
         *     parameters:
         *       - in: path
         *         name: id
         *         required: true
         *         description: The ID of the lipid test to be deleted.
         *         schema:
         *           type: string
         *     responses:
         *       204:
         *         description: Resource deleted successfully.
         *       404:
         *         description: Resource not found.
         *       500:
         *         description: Internal server error.
         * 
         */
        this.router.delete(constants.API.V1 + constants.API.TEST + constants.API.LIPID + '/:id', this.asyncHandler(AuthMiddleware.verifyJwt), (req: Request, res: Response) => {
            this.removeRecord(req, res);
        });

        /**
         * @swagger
         * /api/v1/test/lipid:
         *   get:
         *     tags:
         *       - Test
         *     summary: Read lipid tests
         *     description: Read lipid tests.
         *     parameters:
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
         *       200:
         *         description: Successfully returns lipid tests.
         *         content:
         *           application/json:
         *             schema:
         *               $ref: '#/components/schemas/LipidTestListResponseSchema'
         *       500:
         *         description: Internal server error.
         */
        this.router.get(constants.API.V1 + constants.API.TEST + constants.API.LIPID, this.asyncHandler(AuthMiddleware.verifyJwt), (req: Request, res: Response) => {
            this.filterRecords(req, res);
        });
    }

    private async createRecord(req: Request, res: Response) {
        try {
            let data: any = req.body;
            data.test_type = constants.TESTS.LIPID.toUpperCase();
            let result: any = await this.service.store(data, req.headers);
            ResponseService.sendResponse(req, res, result, null, 'Test created', constants.HTTP_STATUS.CREATED);
        } catch (error: any) {
            LoggerService.log('error', { error: error, message: 'Error in creating lipid test', location: 'lipid-test-controller => createRecord', data: JSON.stringify(error) });
            ResponseService.sendResponse(req, res, null, error, 'Error in creating lipid test');
        }
    }

    private async filterRecords(req: Request, res: Response) {
        try {
            let data: any = req.query;
            data.test_type = constants.TESTS.LIPID.toUpperCase();
            let result: any = await this.service.filterRecords(data, req.headers);
            ResponseService.sendResponse(req, res, result, null, result.message, constants.HTTP_STATUS.OK);
        } catch (error: any) {
            LoggerService.log('error', { error: error, message: 'Error in filtering lipid tests', location: 'lipid-test-controller => filterRecords', data: JSON.stringify(error) });
            ResponseService.sendResponse(req, res, null, error, 'Error in filtering lipid test');
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
            LoggerService.log('error', { error: error, message: 'Error in finding lipid test', location: 'lipid-test-controller => find', data: JSON.stringify(error) });
            ResponseService.sendResponse(req, res, null, error, 'Error in finding lipid test');
        }
    }

    private async removeRecord(req: Request, res: Response) {
        try {
            let result: any = await this.service.remove(req.body, req.headers);
            if (result) {
                ResponseService.sendResponse(req, res, result, null, 'Test deleted');
            } else {
                ResponseService.sendResponse(req, res, null, null, 'Not found', constants.HTTP_STATUS.NOT_FOUND);
            }
        } catch (error: any) {
            LoggerService.log('error', { error: error, message: 'Error in removing lipid test', location: 'lipid-test-controller => remove', data: JSON.stringify(error) });
            ResponseService.sendResponse(req, res, null, error, 'Error in removing lipid test');
        }
    }
}
