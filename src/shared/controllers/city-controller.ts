import { Request, Response } from 'express';

import constants from 'utils/constants';
import AuthMiddleware from 'middlewares/auth-middleware';
import LoggerService from 'shared/services/logger-service';
import BaseController from 'shared/controllers/base-controller';

import CityService from 'shared/services/city-service';
import { ResponseService } from 'shared/services/response-service';

export default class CityController extends BaseController {
    private readonly cityService: CityService;

    constructor() {
        super();

        this.cityService = new CityService();
        this.setupRoutes();
    }

    public setupRoutes() {
        /**
         * @swagger
         * /api/v1/cities:
         *   post:
         *     tags:
         *       - City
         *     summary: Create a new city.
         *     description: Create a new city.
         *     requestBody:
         *       description: The filter criteria.
         *       required: true
         *       content:
         *           application/json:
         *             schema:
         *               type: object
         *               $ref: '#/components/schemas/CityCreateRequestSchema'
         *     responses:
         *       201:
         *         description: Successfully returns city created success.
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               $ref: '#/components/schemas/CityCreateResponseSchema'
         *       500:
         *         description: Internal server error.
         *
         */
        this.router.post(constants.API.V1 + constants.API.CITY, this.asyncHandler(AuthMiddleware.verifyJwt), (req: Request, res: Response) => {
            this.createRecord(req, res);
        });

        /**
         * @swagger
         * /api/v1/cities/{id}:
         *   get:
         *     tags:
         *       - City
         *     summary: Get city details.
         *     description: Get city details.
         *     parameters:
         *       - in: path
         *         name: id
         *         required: true
         *         schema:
         *           type: string
         *           description: Id for city.
         *     responses:
         *       200:
         *         description: Successfully returns city details.
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               properties:
         *                 data:
         *                   $ref: '#/components/schemas/CityDetailResponseSchema'
         *       500:
         *         description: Internal server error.
         */
        this.router.get(constants.API.V1 + constants.API.CITY + '/:id', this.asyncHandler(AuthMiddleware.verifyJwt), (req: Request, res: Response) => {
            this.findRecord(req, res);
        });

        /**
         * @swagger
         * /api/v1/cities/{id}:
         *   put:
         *     tags:
         *       - City
         *     summary: Update a resource
         *     description: Update an existing city by ID.
         *     parameters:
         *       - in: path
         *         name: id
         *         required: true
         *         description: The ID of the city to be updated.
         *         schema:
         *           type: string
         *     requestBody:
         *       description: City data to be updated.
         *       required: true
         *       content:
         *           application/json:
         *             schema:
         *               type: object
         *               $ref: '#/components/schemas/CityUpdateRequestSchema'
         *     responses:
         *       200:
         *         description: Successfully updated city.
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               properties:
         *                 success:
         *                   type: boolean
         *                   description: Success or failure.
         *       400:
         *         description: Bad city data.
         *       404:
         *         description: City not found.
         *       500:
         *         description: Internal server error.
         */
        this.router.put(constants.API.V1 + constants.API.CITY + '/:id', this.asyncHandler(AuthMiddleware.verifyJwt), (req: Request, res: Response) => {
            this.updateRecord(req, res);
        });

        /**
         * @swagger
         * /api/v1/cities/{id}:
         *   delete:
         *     tags:
         *       - City
         *     summary: Delete a resource
         *     description: Remove an existing city by ID.
         *     parameters:
         *       - in: path
         *         name: id
         *         required: true
         *         description: The ID of the city to be deleted.
         *         schema:
         *           type: string
         *     responses:
         *       204:
         *         description: Successfully updated city.
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
        this.router.delete(constants.API.V1 + constants.API.CITY + '/:id', this.asyncHandler(AuthMiddleware.verifyJwt), (req: Request, res: Response) => {
            this.removeRecord(req, res);
        });

        /**
         * @swagger
         * /api/v1/cities:
         *   get:
         *     tags:
         *       - City
         *     summary: Read cities
         *     description: Read cities for the specified endpoint based on given criteria.
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
         *         description: Successfully returns city details.
         *         content:
         *           application/json:
         *             schema:
         *               $ref: '#/components/schemas/CityListResponseSchema'
         *       500:
         *         description: Internal server error.
         */
        this.router.get(constants.API.V1 + constants.API.CITY, this.asyncHandler(AuthMiddleware.verifyJwt), (req: Request, res: Response) => {
            this.filterRecords(req, res);
        });
    }

    private async createRecord(req: Request, res: Response) {
        try {
            let result: any = await this.cityService.store(req.body, req.headers);
            ResponseService.sendResponse(req, res, result, null, 'City created', constants.HTTP_STATUS.CREATED);
        } catch (error: any) {
            LoggerService.log('error', { error: error, message: 'Error in creating city', location: 'city-controller => createRecord', data: JSON.stringify(error) });
            ResponseService.sendResponse(req, res, null, error, 'Error in creating city');
        }
    }

    private async filterRecords(req: Request, res: Response) {
        try {
            let result: any = await this.cityService.filterRecords(req.query, req.headers);
            ResponseService.sendResponse(req, res, result, null, result.message, constants.HTTP_STATUS.OK);
        } catch (error: any) {
            LoggerService.log('error', { error: error, message: 'Error in filtering cities', location: 'city-controller => filterRecords', data: JSON.stringify(error) });
            ResponseService.sendResponse(req, res, null, error, 'Error in filtering city');
        }
    }

    private async findRecord(req: Request, res: Response) {
        try {
            let result: any = await this.cityService.findRecord(req.params.id, req.headers);
            if (result) {
                ResponseService.sendResponse(req, res, result, null, 'City found', constants.HTTP_STATUS.OK);
            } else {
                ResponseService.sendResponse(req, res, null, null, 'Not found', constants.HTTP_STATUS.NOT_FOUND);
            }
        } catch (error: any) {
            LoggerService.log('error', { error: error, message: 'Error in finding city', location: 'city-controller => find', data: JSON.stringify(error) });
            ResponseService.sendResponse(req, res, null, error, 'Error in finding city');
        }
    }

    private async updateRecord(req: Request, res: Response) {
        try {
            let result: any = await this.cityService.update(req.params.id, req.body, req.headers);
            if (result) {
                ResponseService.sendResponse(req, res, result, null, 'City updated', constants.HTTP_STATUS.OK);
            } else {
                ResponseService.sendResponse(req, res, null, null, 'Not found', constants.HTTP_STATUS.NOT_FOUND);
            }
        } catch (error: any) {
            LoggerService.log('error', { error: error, message: 'Error in updating city', location: 'city-controller => update', data: JSON.stringify(error) });
            ResponseService.sendResponse(req, res, null, error, 'Error in updating city');
        }
    }

    private async removeRecord(req: Request, res: Response) {
        try {
            let result: any = await this.cityService.remove(req.params.id, req.headers);
            if (result) {
                ResponseService.sendResponse(req, res, result, null, 'City deleted');
            } else {
                ResponseService.sendResponse(req, res, null, null, 'Not found', constants.HTTP_STATUS.NOT_FOUND);
            }
        } catch (error: any) {
            LoggerService.log('error', { error: error, message: 'Error in removing city', location: 'city-controller => remove', data: JSON.stringify(error) });
            ResponseService.sendResponse(req, res, null, error, 'Error in removing city');
        }
    }
}
