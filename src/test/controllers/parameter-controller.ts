import { Request, Response } from 'express';

import constants from 'utils/constants';
import AuthMiddleware from 'middlewares/auth-middleware';
import LoggerService from 'shared/services/logger-service';
import BaseController from 'shared/controllers/base-controller';

import ParameterService from '../services/parameter-service';
import { ResponseService } from 'shared/services/response-service';

export default class ParameterController extends BaseController {
    private readonly service: ParameterService;

    constructor() {
        super();

        this.service = new ParameterService();
        this.setupRoutes();
    }

    public setupRoutes() {
        /**
         * @swagger
         * /api/v1/parameters:
         *   post:
         *     tags:
         *       - Parameter
         *     summary: Create a new parameter.
         *     description: Create a new parameter.
         *     requestBody:
         *       description: The filter criteria.
         *       required: true
         *       content:
         *           application/json:
         *             schema:
         *               type: object
         *               $ref: '#/components/schemas/ParameterCreateRequestSchema'
         *     responses:
         *       201:
         *         description: Successfully returns parameter created success.
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               $ref: '#/components/schemas/ParameterCreateResponseSchema'
         *       500:
         *         description: Internal server error.
         *
         */
        this.router.post(constants.API.V1 + constants.API.PARAMETER, this.asyncHandler(AuthMiddleware.verifyJwt), (req: Request, res: Response) => {
            this.createRecord(req, res);
        });

        /**
         * @swagger
         * /api/v1/parameters/{id}:
         *   get:
         *     tags:
         *       - Parameter
         *     summary: Get parameter details.
         *     description: Get parameter details.
         *     parameters:
         *       - in: path
         *         name: id
         *         required: true
         *         schema:
         *           type: string
         *           description: Id for parameter.
         *     responses:
         *       200:
         *         description: Successfully returns parameter details.
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               properties:
         *                 data:
         *                   $ref: '#/components/schemas/ParameterDetailResponseSchema'
         *       500:
         *         description: Internal server error.
         */
        this.router.get(constants.API.V1 + constants.API.PARAMETER + '/:id', this.asyncHandler(AuthMiddleware.verifyJwt), (req: Request, res: Response) => {
            this.findRecord(req, res);
        });

        /**
         * @swagger
         * /api/v1/parameters/{id}:
         *   put:
         *     tags:
         *       - Parameter
         *     summary: Update a resource
         *     description: Update an existing parameter by ID.
         *     parameters:
         *       - in: path
         *         name: id
         *         required: true
         *         description: The ID of the parameter to be updated.
         *         schema:
         *           type: string
         *     requestBody:
         *       description: Parameter data to be updated.
         *       required: true
         *       content:
         *           application/json:
         *             schema:
         *               type: object
         *               $ref: '#/components/schemas/ParameterUpdateRequestSchema'
         *     responses:
         *       200:
         *         description: Successfully updated parameter.
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               properties:
         *                 success:
         *                   type: boolean
         *                   description: Success or failure.
         *       400:
         *         description: Bad parameter data.
         *       404:
         *         description: Parameter not found.
         *       500:
         *         description: Internal server error.
         */
        this.router.put(constants.API.V1 + constants.API.PARAMETER + '/:id', this.asyncHandler(AuthMiddleware.verifyJwt), (req: Request, res: Response) => {
            this.updateRecord(req, res);
        });

        /**
         * @swagger
         * /api/v1/parameters/{id}:
         *   delete:
         *     tags:
         *       - Parameter
         *     summary: Delete a resource
         *     description: Remove an existing parameter by ID.
         *     parameters:
         *       - in: path
         *         name: id
         *         required: true
         *         description: The ID of the parameter to be deleted.
         *         schema:
         *           type: string
         *     responses:
         *       204:
         *         description: Successfully updated parameter.
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               properties:
         *                 success:
         *                   type: boolean
         *                   description: Success or failure.
         *       404:
         *         description: Resource not found.
         *       500:
         *         description: Internal server error.
         * 
         */
        this.router.delete(constants.API.V1 + constants.API.PARAMETER + '/:id', this.asyncHandler(AuthMiddleware.verifyJwt), (req: Request, res: Response) => {
            this.removeRecord(req, res);
        });

        /**
         * @swagger
         * /api/v1/parameters:
         *   get:
         *     tags:
         *       - Parameter
         *     summary: Read parameters
         *     description: Read parameters for the specified endpoint based on given criteria.
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
         *         description: Successfully returns parameter details.
         *         content:
         *           application/json:
         *             schema:
         *               $ref: '#/components/schemas/ParameterListResponseSchema'
         *       500:
         *         description: Internal server error.
         */
        this.router.get(constants.API.V1 + constants.API.PARAMETER, this.asyncHandler(AuthMiddleware.verifyJwt), (req: Request, res: Response) => {
            this.filterRecords(req, res);
        });
    }

    private async createRecord(req: Request, res: Response) {
        try {
            let result: any = await this.service.store(req.body, req.headers);
            ResponseService.sendResponse(req, res, result, null, 'Parameter created', constants.HTTP_STATUS.CREATED);
        } catch (error: any) {
            LoggerService.log('error', { error: error, message: 'Error in creating parameter', location: 'parameter-controller => createRecord', data: JSON.stringify(error) });
            ResponseService.sendResponse(req, res, null, error, 'Error in creating parameter');
        }
    }

    private async filterRecords(req: Request, res: Response) {
        try {
            let result: any = await this.service.filterRecords(req.query, req.headers);
            ResponseService.sendResponse(req, res, result, null, result.message, constants.HTTP_STATUS.OK);
        } catch (error: any) {
            LoggerService.log('error', { error: error, message: 'Error in filtering parameters', location: 'parameter-controller => filterRecords', data: JSON.stringify(error) });
            ResponseService.sendResponse(req, res, null, error, 'Error in filtering parameter');
        }
    }

    private async findRecord(req: Request, res: Response) {
        try {
            let result: any = await this.service.findRecord(req.params.id, req.headers);
            if (result) {
                ResponseService.sendResponse(req, res, result, null, 'Parameter found', constants.HTTP_STATUS.OK);
            } else {
                ResponseService.sendResponse(req, res, null, null, 'Not found', constants.HTTP_STATUS.NOT_FOUND);
            }
        } catch (error: any) {
            LoggerService.log('error', { error: error, message: 'Error in finding parameter', location: 'parameter-controller => find', data: JSON.stringify(error) });
            ResponseService.sendResponse(req, res, null, error, 'Error in finding parameter');
        }
    }

    private async updateRecord(req: Request, res: Response) {
        try {
            let result: any = await this.service.update(req.params.id, req.body, req.headers);
            if (result) {
                ResponseService.sendResponse(req, res, result, null, 'Parameter updated', constants.HTTP_STATUS.OK);
            } else {
                ResponseService.sendResponse(req, res, null, null, 'Not found', constants.HTTP_STATUS.NOT_FOUND);
            }
        } catch (error: any) {
            LoggerService.log('error', { error: error, message: 'Error in updating parameter', location: 'parameter-controller => update', data: JSON.stringify(error) });
            ResponseService.sendResponse(req, res, null, error, 'Error in updating parameter');
        }
    }

    private async removeRecord(req: Request, res: Response) {
        try {
            let result: any = await this.service.remove(req.params.id, req.headers);
            if (result) {
                ResponseService.sendResponse(req, res, result, null, 'Parameter deleted');
            } else {
                ResponseService.sendResponse(req, res, null, null, 'Not found', constants.HTTP_STATUS.NOT_FOUND);
            }
        } catch (error: any) {
            LoggerService.log('error', { error: error, message: 'Error in removing parameter', location: 'parameter-controller => remove', data: JSON.stringify(error) });
            ResponseService.sendResponse(req, res, null, error, 'Error in removing parameter');
        }
    }
}
