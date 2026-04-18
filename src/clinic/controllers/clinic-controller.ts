import { Request, Response } from 'express';

import constants from 'utils/constants';
import AuthMiddleware from 'middlewares/auth-middleware';
import LoggerService from 'shared/services/logger-service';
import BaseController from 'shared/controllers/base-controller';

import ClinicService from 'clinic/services/clinic-service';
import { ResponseService } from 'shared/services/response-service';

export default class ClinicController extends BaseController {
    private readonly clinicService: ClinicService;

    constructor() {
        super();

        this.clinicService = new ClinicService();
        this.setupRoutes();
    }

    public setupRoutes() {
        /**
         * @swagger
         * /api/v1/clinics:
         *   post:
         *     tags:
         *       - Clinic
         *     summary: Create a new clinic.
         *     description: Create a new clinic.
         *     requestBody:
         *       description: The filter criteria.
         *       required: true
         *       content:
         *           application/json:
         *             schema:
         *               type: object
         *               $ref: '#/components/schemas/ClinicCreateRequestSchema'
         *     responses:
         *       201:
         *         description: Successfully returns clinic created success.
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               $ref: '#/components/schemas/ClinicCreateResponseSchema'
         *       500:
         *         description: Internal server error.
         *
         */
        this.router.post(constants.API.V1 + constants.API.CLINIC, this.asyncHandler(AuthMiddleware.verifyJwt), (req: Request, res: Response) => {
            this.createRecord(req, res);
        });

        /**
         * @swagger
         * /api/v1/clinics/{id}:
         *   get:
         *     tags:
         *       - Clinic
         *     summary: Get clinic details.
         *     description: Get clinic details.
         *     parameters:
         *       - in: path
         *         name: id
         *         required: true
         *         schema:
         *           type: string
         *           description: Id for clinic.
         *     responses:
         *       200:
         *         description: Successfully returns clinic details.
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               properties:
         *                 data:
         *                   $ref: '#/components/schemas/ClinicDetailResponseSchema'
         *       500:
         *         description: Internal server error.
         */
        this.router.get(constants.API.V1 + constants.API.CLINIC + '/:id', this.asyncHandler(AuthMiddleware.verifyJwt), (req: Request, res: Response) => {
            this.findRecord(req, res);
        });

        /**
         * @swagger
         * /api/v1/clinics/{id}:
         *   put:
         *     tags:
         *       - Clinic
         *     summary: Update a resource
         *     description: Update an existing clinic by ID.
         *     parameters:
         *       - in: path
         *         name: id
         *         required: true
         *         description: The ID of the clinic to be updated.
         *         schema:
         *           type: string
         *     requestBody:
         *       description: Clinic data to be updated.
         *       required: true
         *       content:
         *           application/json:
         *             schema:
         *               type: object
         *               $ref: '#/components/schemas/ClinicUpdateRequestSchema'
         *     responses:
         *       200:
         *         description: Successfully updated clinic.
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               properties:
         *                 success:
         *                   type: boolean
         *                   description: Success or failure.
         *       400:
         *         description: Bad clinic data.
         *       404:
         *         description: Clinic not found.
         *       500:
         *         description: Internal server error.
         */
        this.router.put(constants.API.V1 + constants.API.CLINIC + '/:id', this.asyncHandler(AuthMiddleware.verifyJwt), (req: Request, res: Response) => {
            this.updateRecord(req, res);
        });

        /**
         * @swagger
         * /api/v1/clinics/{id}:
         *   delete:
         *     tags:
         *       - Clinic
         *     summary: Delete a resource
         *     description: Remove an existing clinic by ID.
         *     parameters:
         *       - in: path
         *         name: id
         *         required: true
         *         description: The ID of the clinic to be deleted.
         *         schema:
         *           type: string
         *     responses:
         *       204:
         *         description: Successfully updated clinic.
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
        this.router.delete(constants.API.V1 + constants.API.CLINIC + '/:id', this.asyncHandler(AuthMiddleware.verifyJwt), (req: Request, res: Response) => {
            this.removeRecord(req, res);
        });

        /**
         * @swagger
         * /api/v1/clinics:
         *   get:
         *     tags:
         *       - Clinic
         *     summary: Read clinics
         *     description: Read clinics for the specified endpoint based on given criteria.
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
         *         description: Successfully returns clinic details.
         *         content:
         *           application/json:
         *             schema:
         *               $ref: '#/components/schemas/ClinicListResponseSchema'
         *       500:
         *         description: Internal server error.
         */
        this.router.get(constants.API.V1 + constants.API.CLINIC, this.asyncHandler(AuthMiddleware.verifyJwt), (req: Request, res: Response) => {
            this.filterRecords(req, res);
        });
    }

    private async createRecord(req: Request, res: Response) {
        try {
            let result: any = await this.clinicService.store(req.body, req.headers);
            ResponseService.sendResponse(req, res, result, null, 'Clinic created', constants.HTTP_STATUS.CREATED);
        } catch (error: any) {
            LoggerService.log('error', { error: error, message: 'Error in creating clinic', location: 'clinic-controller => createRecord', data: JSON.stringify(error) });
            ResponseService.sendResponse(req, res, null, error, 'Error in creating clinic');
        }
    }

    private async filterRecords(req: Request, res: Response) {
        try {
            let result: any = await this.clinicService.filterRecords(req.query, req.headers);
            ResponseService.sendResponse(req, res, result, null, result.message, constants.HTTP_STATUS.OK);
        } catch (error: any) {
            LoggerService.log('error', { error: error, message: 'Error in filtering clinics', location: 'clinic-controller => filterRecords', data: JSON.stringify(error) });
            ResponseService.sendResponse(req, res, null, error, 'Error in filtering clinic');
        }
    }

    private async findRecord(req: Request, res: Response) {
        try {
            let result: any = await this.clinicService.findRecord(req.params.id, req.headers);
            if (result) {
                ResponseService.sendResponse(req, res, result, null, 'Clinic found', constants.HTTP_STATUS.OK);
            } else {
                ResponseService.sendResponse(req, res, null, null, 'Not found', constants.HTTP_STATUS.NOT_FOUND);
            }
        } catch (error: any) {
            LoggerService.log('error', { error: error, message: 'Error in finding clinic', location: 'clinic-controller => find', data: JSON.stringify(error) });
            ResponseService.sendResponse(req, res, null, error, 'Error in finding clinic');
        }
    }

    private async updateRecord(req: Request, res: Response) {
        try {
            let result: any = await this.clinicService.update(req.params.id, req.body, req.headers);
            if (result) {
                ResponseService.sendResponse(req, res, result, null, 'Clinic updated', constants.HTTP_STATUS.OK);
            } else {
                ResponseService.sendResponse(req, res, null, null, 'Not found', constants.HTTP_STATUS.NOT_FOUND);
            }
        } catch (error: any) {
            LoggerService.log('error', { error: error, message: 'Error in updating clinic', location: 'clinic-controller => update', data: JSON.stringify(error) });
            ResponseService.sendResponse(req, res, null, error, 'Error in updating clinic');
        }
    }

    private async removeRecord(req: Request, res: Response) {
        try {
            let result: any = await this.clinicService.remove(req.params.id, req.headers);
            if (result) {
                ResponseService.sendResponse(req, res, result, null, 'Clinic deleted');
            } else {
                ResponseService.sendResponse(req, res, null, null, 'Not found', constants.HTTP_STATUS.NOT_FOUND);
            }
        } catch (error: any) {
            LoggerService.log('error', { error: error, message: 'Error in removing clinic', location: 'clinic-controller => remove', data: JSON.stringify(error) });
            ResponseService.sendResponse(req, res, null, error, 'Error in removing clinic');
        }
    }
}
