import { Request, Response } from 'express';

import constants from 'utils/constants';
import AuthMiddleware from 'middlewares/auth-middleware';
import LoggerService from 'shared/services/logger-service';
import BaseController from 'shared/controllers/base-controller';

import StateService from 'shared/services/state-service';
import { ResponseService } from 'shared/services/response-service';

export default class StateController extends BaseController {
    private readonly stateService: StateService;

    constructor() {
        super();

        this.stateService = new StateService();
        this.setupRoutes();
    }

    public setupRoutes() {
        /**
         * @swagger
         * /api/v1/states:
         *   post:
         *     tags:
         *       - State
         *     summary: Create a new state.
         *     description: Create a new state.
         *     requestBody:
         *       description: The filter criteria.
         *       required: true
         *       content:
         *           application/json:
         *             schema:
         *               type: object
         *               $ref: '#/components/schemas/StateCreateRequestSchema'
         *     responses:
         *       201:
         *         description: Successfully returns state created success.
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               $ref: '#/components/schemas/StateCreateResponseSchema'
         *       500:
         *         description: Internal server error.
         *
         */
        this.router.post(constants.API.V1 + constants.API.STATE, this.asyncHandler(AuthMiddleware.verifyJwt), (req: Request, res: Response) => {
            this.createRecord(req, res);
        });

        /**
         * @swagger
         * /api/v1/states/{id}:
         *   get:
         *     tags:
         *       - State
         *     summary: Get state details.
         *     description: Get state details.
         *     parameters:
         *       - in: path
         *         name: id
         *         required: true
         *         schema:
         *           type: string
         *           description: Id for state.
         *     responses:
         *       200:
         *         description: Successfully returns state details.
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               properties:
         *                 data:
         *                   $ref: '#/components/schemas/StateDetailResponseSchema'
         *       500:
         *         description: Internal server error.
         */
        this.router.get(constants.API.V1 + constants.API.STATE + '/:id', this.asyncHandler(AuthMiddleware.verifyJwt), (req: Request, res: Response) => {
            this.findRecord(req, res);
        });

        /**
         * @swagger
         * /api/v1/states/{id}:
         *   put:
         *     tags:
         *       - State
         *     summary: Update a resource
         *     description: Update an existing state by ID.
         *     parameters:
         *       - in: path
         *         name: id
         *         required: true
         *         description: The ID of the state to be updated.
         *         schema:
         *           type: string
         *     requestBody:
         *       description: State data to be updated.
         *       required: true
         *       content:
         *           application/json:
         *             schema:
         *               type: object
         *               $ref: '#/components/schemas/StateUpdateRequestSchema'
         *     responses:
         *       200:
         *         description: Successfully updated state.
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               properties:
         *                 success:
         *                   type: boolean
         *                   description: Success or failure.
         *       400:
         *         description: Bad state data.
         *       404:
         *         description: State not found.
         *       500:
         *         description: Internal server error.
         */
        this.router.put(constants.API.V1 + constants.API.STATE + '/:id', this.asyncHandler(AuthMiddleware.verifyJwt), (req: Request, res: Response) => {
            this.updateRecord(req, res);
        });

        /**
         * @swagger
         * /api/v1/states/{id}:
         *   delete:
         *     tags:
         *       - State
         *     summary: Delete a resource
         *     description: Remove an existing state by ID.
         *     parameters:
         *       - in: path
         *         name: id
         *         required: true
         *         description: The ID of the state to be deleted.
         *         schema:
         *           type: string
         *     responses:
         *       204:
         *         description: Successfully updated state.
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
        this.router.delete(constants.API.V1 + constants.API.STATE + '/:id', this.asyncHandler(AuthMiddleware.verifyJwt), (req: Request, res: Response) => {
            this.removeRecord(req, res);
        });

        /**
         * @swagger
         * /api/v1/states:
         *   get:
         *     tags:
         *       - State
         *     summary: Read states
         *     description: Read states for the specified endpoint based on given criteria.
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
         *         description: Successfully returns state details.
         *         content:
         *           application/json:
         *             schema:
         *               $ref: '#/components/schemas/StateListResponseSchema'
         *       500:
         *         description: Internal server error.
         */
        this.router.get(constants.API.V1 + constants.API.STATE, this.asyncHandler(AuthMiddleware.verifyJwt), (req: Request, res: Response) => {
            this.filterRecords(req, res);
        });
    }

    private async createRecord(req: Request, res: Response) {
        try {
            let result: any = await this.stateService.store(req.body, req.headers);
            ResponseService.sendResponse(req, res, result, null, 'State created', constants.HTTP_STATUS.CREATED);
        } catch (error: any) {
            LoggerService.log('error', { error: error, message: 'Error in creating state', location: 'state-controller => createRecord', data: JSON.stringify(error) });
            ResponseService.sendResponse(req, res, null, error, 'Error in creating state');
        }
    }

    private async filterRecords(req: Request, res: Response) {
        try {
            let result: any = await this.stateService.filterRecords(req.query, req.headers);
            ResponseService.sendResponse(req, res, result, null, result.message, constants.HTTP_STATUS.OK);
        } catch (error: any) {
            LoggerService.log('error', { error: error, message: 'Error in filtering states', location: 'state-controller => filterRecords', data: JSON.stringify(error) });
            ResponseService.sendResponse(req, res, null, error, 'Error in filtering state');
        }
    }

    private async findRecord(req: Request, res: Response) {
        try {
            let result: any = await this.stateService.findRecord(req.params.id, req.headers);
            if (result) {
                ResponseService.sendResponse(req, res, result, null, 'State found', constants.HTTP_STATUS.OK);
            } else {
                ResponseService.sendResponse(req, res, null, null, 'Not found', constants.HTTP_STATUS.NOT_FOUND);
            }
        } catch (error: any) {
            LoggerService.log('error', { error: error, message: 'Error in finding state', location: 'state-controller => find', data: JSON.stringify(error) });
            ResponseService.sendResponse(req, res, null, error, 'Error in finding state');
        }
    }

    private async updateRecord(req: Request, res: Response) {
        try {
            let result: any = await this.stateService.update(req.params.id, req.body, req.headers);
            if (result) {
                ResponseService.sendResponse(req, res, result, null, 'State updated', constants.HTTP_STATUS.OK);
            } else {
                ResponseService.sendResponse(req, res, null, null, 'Not found', constants.HTTP_STATUS.NOT_FOUND);
            }
        } catch (error: any) {
            LoggerService.log('error', { error: error, message: 'Error in updating state', location: 'state-controller => update', data: JSON.stringify(error) });
            ResponseService.sendResponse(req, res, null, error, 'Error in updating state');
        }
    }

    private async removeRecord(req: Request, res: Response) {
        try {
            let result: any = await this.stateService.remove(req.params.id, req.headers);
            if (result) {
                ResponseService.sendResponse(req, res, result, null, 'State deleted');
            } else {
                ResponseService.sendResponse(req, res, null, null, 'Not found', constants.HTTP_STATUS.NOT_FOUND);
            }
        } catch (error: any) {
            LoggerService.log('error', { error: error, message: 'Error in removing state', location: 'state-controller => remove', data: JSON.stringify(error) });
            ResponseService.sendResponse(req, res, null, error, 'Error in removing state');
        }
    }
}
