import { Request, Response } from 'express';

import constants from 'utils/constants';
import AuthMiddleware from 'middlewares/auth-middleware';
import LoggerService from 'shared/services/logger-service';
import BaseController from 'shared/controllers/base-controller';

import PatientService from 'patient/services/patient-service';
import { ResponseService } from 'shared/services/response-service';

export default class PatientController extends BaseController {
  private readonly patientService: PatientService;

  constructor() {
    super();

    this.patientService = new PatientService();
    this.setupRoutes();
  }

  public setupRoutes() {
    /**
     * @swagger
     * /api/v1/patients:
     *   post:
     *     tags:
     *       - Patient
     *     summary: Create a new patient.
     *     description: Create a new patient.
     *     requestBody:
     *       description: The filter criteria.
     *       required: true
     *       content:
     *           application/json:
     *             schema:
     *               type: object
     *               $ref: '#/components/schemas/PatientCreateRequestSchema'
     *     responses:
     *       201:
     *         description: Successfully returns patient created success.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               $ref: '#/components/schemas/PatientCreateResponseSchema'
     *       500:
     *         description: Internal server error.
     *
     */
    this.router.post(constants.API.V1 + constants.API.PATIENT, this.asyncHandler(AuthMiddleware.verifyJwt), (req: Request, res: Response) => {
      this.createRecord(req, res);
    });

    /**
     * @swagger
     * /api/v1/patients/{id}:
     *   get:
     *     tags:
     *       - Patient
     *     summary: Get patient details.
     *     description: Get patient details.
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *           description: Id for patient.
     *     responses:
     *       200:
     *         description: Successfully returns patient details.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 data:
     *                   $ref: '#/components/schemas/PatientDetailResponseSchema'
     *       500:
     *         description: Internal server error.
     */
    this.router.get(constants.API.V1 + constants.API.PATIENT + '/:id', this.asyncHandler(AuthMiddleware.verifyJwt), (req: Request, res: Response) => {
      this.findRecord(req, res);
    });

    /**
     * @swagger
     * /api/v1/patients/{id}:
     *   put:
     *     tags:
     *       - Patient
     *     summary: Update a resource
     *     description: Update an existing patient by ID.
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         description: The ID of the patient to be updated.
     *         schema:
     *           type: string
     *     requestBody:
     *       description: Patient data to be updated.
     *       required: true
     *       content:
     *           application/json:
     *             schema:
     *               type: object
     *               $ref: '#/components/schemas/PatientUpdateRequestSchema'
     *     responses:
     *       200:
     *         description: Successfully updated patient.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                   description: Success or failure.
     *       400:
     *         description: Bad patient data.
     *       404:
     *         description: Patient not found.
     *       500:
     *         description: Internal server error.
     */
    this.router.put(constants.API.V1 + constants.API.PATIENT + '/:id', this.asyncHandler(AuthMiddleware.verifyJwt), (req: Request, res: Response) => {
      this.updateRecord(req, res);
    });

    /**
     * @swagger
     * /api/v1/patients/{id}:
     *   delete:
     *     tags:
     *       - Patient
     *     summary: Delete a resource
     *     description: Remove an existing patient by ID.
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         description: The ID of the patient to be deleted.
     *         schema:
     *           type: string
     *     responses:
     *       204:
     *         description: Successfully updated patient.
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
    this.router.delete(constants.API.V1 + constants.API.PATIENT + '/:id', this.asyncHandler(AuthMiddleware.verifyJwt), (req: Request, res: Response) => {
      this.removeRecord(req, res);
    });

    /**
     * @swagger
     * /api/v1/patients:
     *   get:
     *     tags:
     *       - Patient
     *     summary: Read patients
     *     description: Read patients for the specified endpoint based on given criteria.
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
     *         description: Successfully returns patient details.
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/PatientListResponseSchema'
     *       500:
     *         description: Internal server error.
     */
    this.router.get(constants.API.V1 + constants.API.PATIENT, this.asyncHandler(AuthMiddleware.verifyJwt), (req: Request, res: Response) => {
      this.filterRecords(req, res);
    });
  }

  private async createRecord(req: Request, res: Response) {
    try {
      let result: any = await this.patientService.store(req.body, req.headers);
      ResponseService.sendResponse(req, res, result, null, 'Patient created', constants.HTTP_STATUS.CREATED);
    } catch (error: any) {
      LoggerService.log('error', { error: error, message: 'Error in creating patient', location: 'patient-controller => createRecord', data: JSON.stringify(error) });
      ResponseService.sendResponse(req, res, null, error, 'Error in creating patient');
    }
  }

  private async filterRecords(req: Request, res: Response) {
    try {
      let result: any = await this.patientService.filterRecords(req.query, req.headers);
      ResponseService.sendResponse(req, res, result, null, result.message, constants.HTTP_STATUS.OK);
    } catch (error: any) {
      LoggerService.log('error', { error: error, message: 'Error in filtering patients', location: 'patient-controller => filterRecords', data: JSON.stringify(error) });
      ResponseService.sendResponse(req, res, null, error, 'Error in filtering patient');
    }
  }

  private async findRecord(req: Request, res: Response) {
    try {
      let result: any = await this.patientService.findRecord(req.params.id, req.headers);
      if (result) {
        ResponseService.sendResponse(req, res, result, null, 'Patient found', constants.HTTP_STATUS.OK);
      } else {
        ResponseService.sendResponse(req, res, null, null, 'Not found', constants.HTTP_STATUS.NOT_FOUND);
      }
    } catch (error: any) {
      LoggerService.log('error', { error: error, message: 'Error in finding patient', location: 'patient-controller => find', data: JSON.stringify(error) });
      ResponseService.sendResponse(req, res, null, error, 'Error in finding patient');
    }
  }

  private async updateRecord(req: Request, res: Response) {
    try {
      let result: any = await this.patientService.update(req.params.id, req.body, req.headers);
      if (result) {
        ResponseService.sendResponse(req, res, result, null, 'Patient updated', constants.HTTP_STATUS.OK);
      } else {
        ResponseService.sendResponse(req, res, null, null, 'Not found', constants.HTTP_STATUS.NOT_FOUND);
      }
    } catch (error: any) {
      LoggerService.log('error', { error: error, message: 'Error in updating patient', location: 'patient-controller => update', data: JSON.stringify(error) });
      ResponseService.sendResponse(req, res, null, error, 'Error in updating patient');
    }
  }

  private async removeRecord(req: Request, res: Response) {
    try {
      let result: any = await this.patientService.remove(req.params.id, req.headers);
      if (result) {
        ResponseService.sendResponse(req, res, result, null, 'Patient deleted');
      } else {
        ResponseService.sendResponse(req, res, null, null, 'Not found', constants.HTTP_STATUS.NOT_FOUND);
      }
    } catch (error: any) {
      LoggerService.log('error', { error: error, message: 'Error in removing patient', location: 'patient-controller => remove', data: JSON.stringify(error) });
      ResponseService.sendResponse(req, res, null, error, 'Error in removing patient');
    }
  }
}
