import { Request, Response } from 'express';

import constants from 'utils/constants';
import AuthMiddleware from 'middlewares/auth-middleware';
import LoggerService from 'shared/services/logger-service';
import BaseController from 'shared/controllers/base-controller';

import TestService from 'test/services/test-service';
import { ResponseService } from 'shared/services/response-service';

export default class Hba1cTestController extends BaseController {
    private readonly service: TestService;

    constructor() {
        super();

        this.service = new TestService();
        this.setupRoutes();
    }

    public setupRoutes() {
        /**
         * @swagger
         * /api/v1/test/hba1c:
         *   post:
         *     tags:
         *       - Test
         *     summary: Create a new hba1c test.
         *     description: Create a new hba1c test.
         *     requestBody:
         *       description: Create a new hba1c test.
         *       required: true
         *       content:
         *           application/json:
         *             schema:
         *               type: object
         *               $ref: '#/components/schemas/Hba1cTestCreateRequestSchema'
         *     responses:
         *       201:
         *         description: Hba1c created successfully.
         *       500:
         *         description: Internal server error.
         *
         */
        this.router.post(constants.API.V1 + constants.API.TEST + constants.API.HBA1C, this.asyncHandler(AuthMiddleware.verifyJwt), (req: Request, res: Response) => {
            this.createRecord(req, res);
        });

        /**
         * @swagger
         * /api/v1/test/hba1c/{id}:
         *   get:
         *     tags:
         *       - Test
         *     summary: Get hba1c test records.
         *     description: Get hba1c test records.
         *     parameters:
         *       - in: path
         *         name: id
         *         description: Id of test
         *         schema:
         *           type: string
         *     responses:
         *       200:
         *         description: Successfully returns hba1c tests.
         *         content:
         *           application/json:
         *             schema:
         *               $ref: '#/components/schemas/LipidTestListResponseSchema'
         *       500:
         *         description: Internal server error.
         */
        this.router.get(constants.API.V1 + constants.API.TEST + constants.API.HBA1C + '/:id', this.asyncHandler(AuthMiddleware.verifyJwt), (req: Request, res: Response) => {
            this.findRecord(req, res);
        });

        /**
         * @swagger
         * /api/v1/test/hba1c/{id}:
         *   delete:
         *     tags:
         *       - Test
         *     summary: Delete a resource
         *     description: Remove an existing hba1c test by ID.
         *     parameters:
         *       - in: path
         *         name: id
         *         required: true
         *         description: The ID of the hba1c test to be deleted.
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
        this.router.delete(constants.API.V1 + constants.API.TEST + constants.API.HBA1C + '/:id', this.asyncHandler(AuthMiddleware.verifyJwt), (req: Request, res: Response) => {
            this.removeRecord(req, res);
        });

        /**
         * @swagger
         * /api/v1/test/hba1c:
         *   get:
         *     tags:
         *       - Test
         *     summary: Read hba1c tests
         *     description: Read hba1c tests.
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
         *         description: Resources filtered successfully.
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               $ref: '#/components/schemas/Hba1cTestListResponseSchema'
         *       500:
         *         description: Internal server error.
         */
        this.router.get(constants.API.V1 + constants.API.TEST + constants.API.HBA1C, this.asyncHandler(AuthMiddleware.verifyJwt), (req: Request, res: Response) => {
            this.filterRecords(req, res);
        });
    }

    private async createRecord(req: Request, res: Response) {
        try {
            let data: any = req.body;
            data.test_type = constants.TESTS.HBA1C.toUpperCase();
            let result: any = await this.service.store(data, req.headers);
            ResponseService.sendResponse(req, res, result, null, 'Hba1c created', constants.HTTP_STATUS.CREATED);
        } catch (error: any) {
            LoggerService.log('error', { error: error, message: 'Error in creating hba1c test', location: 'hba1c-test-controller => createRecord', data: JSON.stringify(error) });
            ResponseService.sendResponse(req, res, null, error, 'Error in creating hba1c test');
        }
    }

    private async filterRecords(req: Request, res: Response) {
        try {
            let data: any = req.query;
            data.test_type = constants.TESTS.HBA1C.toUpperCase();
            let result: any = await this.service.filterRecords(data, req.headers);
            ResponseService.sendResponse(req, res, result, null, result.message, constants.HTTP_STATUS.OK);
        } catch (error: any) {
            LoggerService.log('error', { error: error, message: 'Error in filtering hba1c tests', location: 'hba1c-test-controller => filterRecords', data: JSON.stringify(error) });
            ResponseService.sendResponse(req, res, null, error, 'Error in filtering hba1c test');
        }
    }

    private async findRecord(req: Request, res: Response) {
        try {
            let result: any = await this.service.findRecord(req.params.id, req.headers);
            if (result) {
                ResponseService.sendResponse(req, res, result, null, 'Hba1c found', constants.HTTP_STATUS.OK);
            } else {
                ResponseService.sendResponse(req, res, null, null, 'Not found', constants.HTTP_STATUS.NOT_FOUND);
            }
        } catch (error: any) {
            LoggerService.log('error', { error: error, message: 'Error in finding hba1c test', location: 'hba1c-test-controller => find', data: JSON.stringify(error) });
            ResponseService.sendResponse(req, res, null, error, 'Error in finding hba1c test');
        }
    }

    private async removeRecord(req: Request, res: Response) {
        try {
            let result: any = await this.service.remove(req.body, req.headers);
            if (result) {
                ResponseService.sendResponse(req, res, result, null, 'Hba1c deleted');
            } else {
                ResponseService.sendResponse(req, res, null, null, 'Not found', constants.HTTP_STATUS.NOT_FOUND);
            }
        } catch (error: any) {
            LoggerService.log('error', { error: error, message: 'Error in removing hba1c test', location: 'hba1c-test-controller => remove', data: JSON.stringify(error) });
            ResponseService.sendResponse(req, res, null, error, 'Error in removing hba1c test');
        }
    }
}
