import { Request, Response } from 'express';

import constants from 'utils/constants';
import AuthMiddleware from 'middlewares/auth-middleware';
import LoggerService from 'shared/services/logger-service';
import BaseController from 'shared/controllers/base-controller';

import CountryService from 'shared/services/country-service';
import { ResponseService } from 'shared/services/response-service';

export default class CountryController extends BaseController {
    private readonly countryService: CountryService;

    constructor() {
        super();

        this.countryService = new CountryService();
        this.setupRoutes();
    }

    public setupRoutes() {
        /**
         * @swagger
         * /api/v1/countries:
         *   post:
         *     tags:
         *       - Country
         *     summary: Create a new country.
         *     description: Create a new country.
         *     requestBody:
         *       description: The filter criteria.
         *       required: true
         *       content:
         *           application/json:
         *             schema:
         *               type: object
         *               $ref: '#/components/schemas/CountryCreateRequestSchema'
         *     responses:
         *       201:
         *         description: Successfully returns country created success.
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               $ref: '#/components/schemas/CountryCreateResponseSchema'
         *       500:
         *         description: Internal server error.
         *
         */
        this.router.post(constants.API.V1 + constants.API.COUNTRY, this.asyncHandler(AuthMiddleware.verifyJwt), (req: Request, res: Response) => {
            this.createRecord(req, res);
        });

        /**
         * @swagger
         * /api/v1/countries/{id}:
         *   get:
         *     tags:
         *       - Country
         *     summary: Get country details.
         *     description: Get country details.
         *     parameters:
         *       - in: path
         *         name: id
         *         required: true
         *         schema:
         *           type: string
         *           description: Id for country.
         *     responses:
         *       200:
         *         description: Successfully returns country details.
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               properties:
         *                 data:
         *                   $ref: '#/components/schemas/CountryDetailResponseSchema'
         *       500:
         *         description: Internal server error.
         */
        this.router.get(constants.API.V1 + constants.API.COUNTRY + '/:id', this.asyncHandler(AuthMiddleware.verifyJwt), (req: Request, res: Response) => {
            this.findRecord(req, res);
        });

        /**
         * @swagger
         * /api/v1/countries/{id}:
         *   put:
         *     tags:
         *       - Country
         *     summary: Update a resource
         *     description: Update an existing country by ID.
         *     parameters:
         *       - in: path
         *         name: id
         *         required: true
         *         description: The ID of the country to be updated.
         *         schema:
         *           type: string
         *     requestBody:
         *       description: Country data to be updated.
         *       required: true
         *       content:
         *           application/json:
         *             schema:
         *               type: object
         *               $ref: '#/components/schemas/CountryUpdateRequestSchema'
         *     responses:
         *       200:
         *         description: Successfully updated country.
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               properties:
         *                 success:
         *                   type: boolean
         *                   description: Success or failure.
         *       400:
         *         description: Bad country data.
         *       404:
         *         description: Country not found.
         *       500:
         *         description: Internal server error.
         */
        this.router.put(constants.API.V1 + constants.API.COUNTRY + '/:id', this.asyncHandler(AuthMiddleware.verifyJwt), (req: Request, res: Response) => {
            this.updateRecord(req, res);
        });

        /**
         * @swagger
         * /api/v1/countries/{id}:
         *   delete:
         *     tags:
         *       - Country
         *     summary: Delete a resource
         *     description: Remove an existing country by ID.
         *     parameters:
         *       - in: path
         *         name: id
         *         required: true
         *         description: The ID of the country to be deleted.
         *         schema:
         *           type: string
         *     responses:
         *       204:
         *         description: Successfully updated country.
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
        this.router.delete(constants.API.V1 + constants.API.COUNTRY + '/:id', this.asyncHandler(AuthMiddleware.verifyJwt), (req: Request, res: Response) => {
            this.removeRecord(req, res);
        });

        /**
         * @swagger
         * /api/v1/countries:
         *   get:
         *     tags:
         *       - Country
         *     summary: Read countries
         *     description: Read countries for the specified endpoint based on given criteria.
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
         *         description: Successfully returns country details.
         *         content:
         *           application/json:
         *             schema:
         *               $ref: '#/components/schemas/CountryListResponseSchema'
         *       500:
         *         description: Internal server error.
         */
        this.router.get(constants.API.V1 + constants.API.COUNTRY, this.asyncHandler(AuthMiddleware.verifyJwt), (req: Request, res: Response) => {
            this.filterRecords(req, res);
        });
    }

    private async createRecord(req: Request, res: Response) {
        try {
            let result: any = await this.countryService.store(req.body, req.headers);
            ResponseService.sendResponse(req, res, result, null, 'Country created', constants.HTTP_STATUS.CREATED);
        } catch (error: any) {
            LoggerService.log('error', { error: error, message: 'Error in creating country', location: 'country-controller => createRecord', data: JSON.stringify(error) });
            ResponseService.sendResponse(req, res, null, error, 'Error in creating country');
        }
    }

    private async filterRecords(req: Request, res: Response) {
        try {
            let result: any = await this.countryService.filterRecords(req.query, req.headers);
            ResponseService.sendResponse(req, res, result, null, result.message, constants.HTTP_STATUS.OK);
        } catch (error: any) {
            LoggerService.log('error', { error: error, message: 'Error in filtering countries', location: 'country-controller => filterRecords', data: JSON.stringify(error) });
            ResponseService.sendResponse(req, res, null, error, 'Error in filtering country');
        }
    }

    private async findRecord(req: Request, res: Response) {
        try {
            let result: any = await this.countryService.findRecord(req.params.id, req.headers);
            if (result) {
                ResponseService.sendResponse(req, res, result, null, 'Country found', constants.HTTP_STATUS.OK);
            } else {
                ResponseService.sendResponse(req, res, null, null, 'Not found', constants.HTTP_STATUS.NOT_FOUND);
            }
        } catch (error: any) {
            LoggerService.log('error', { error: error, message: 'Error in finding country', location: 'country-controller => find', data: JSON.stringify(error) });
            ResponseService.sendResponse(req, res, null, error, 'Error in finding country');
        }
    }

    private async updateRecord(req: Request, res: Response) {
        try {
            let result: any = await this.countryService.update(req.params.id, req.body, req.headers);
            if (result) {
                ResponseService.sendResponse(req, res, result, null, 'Country updated', constants.HTTP_STATUS.OK);
            } else {
                ResponseService.sendResponse(req, res, null, null, 'Not found', constants.HTTP_STATUS.NOT_FOUND);
            }
        } catch (error: any) {
            LoggerService.log('error', { error: error, message: 'Error in updating country', location: 'country-controller => update', data: JSON.stringify(error) });
            ResponseService.sendResponse(req, res, null, error, 'Error in updating country');
        }
    }

    private async removeRecord(req: Request, res: Response) {
        try {
            let result: any = await this.countryService.remove(req.params.id, req.headers);
            if (result) {
                ResponseService.sendResponse(req, res, result, null, 'Country deleted');
            } else {
                ResponseService.sendResponse(req, res, null, null, 'Not found', constants.HTTP_STATUS.NOT_FOUND);
            }
        } catch (error: any) {
            LoggerService.log('error', { error: error, message: 'Error in removing country', location: 'country-controller => remove', data: JSON.stringify(error) });
            ResponseService.sendResponse(req, res, null, error, 'Error in removing country');
        }
    }
}
