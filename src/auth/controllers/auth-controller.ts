import { Request, Response } from 'express';

import constants from 'utils/constants';
import LoggerService from 'shared/services/logger-service';
import BaseController from 'shared/controllers/base-controller';

import AuthService from 'auth/services/auth-service';
import { ResponseService } from 'shared/services/response-service';

export default class AuthController extends BaseController {
    private readonly authService: AuthService;

    constructor() {
        super();

        this.authService = new AuthService();
        this.setupRoutes();
    }

    public setupRoutes() {
        /**
         * @swagger
         * /api/v1/auth/user/login:
         *   post:
         *     tags:
         *       - Auth
         *     summary: Checks user login.
         *     description: Checks user login.
         *     requestBody:
         *       description: Checks user login.
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *             type: object
         *             properties:
         *               username:
         *                 type: string
         *                 description: Username
         *               password:
         *                 type: string
         *                 description: Password
         *     responses:
         *       200:
         *         description: User login successful or not.
         *       500:
         *         description: Internal server error.
         *
         */
        this.router.post(constants.API.V1 + constants.API.AUTH + '/user/login', (req: Request, res: Response) => {
            this.userLogin(req, res, this);
        });

        /**
         * @swagger
         * /api/v1/auth/clinic/login:
         *   post:
         *     tags:
         *       - Auth
         *     summary: Checks clinic login.
         *     description: Checks clinic login.
         *     requestBody:
         *       description: Checks clinic login.
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *             type: object
         *             properties:
         *               clinic_id:
         *                 type: string
         *                 description: clinic_id field value of clinic
         *               password:
         *                 type: string
         *                 description: Password
         *     responses:
         *       200:
         *         description: Clinic login successful or not.
         *       500:
         *         description: Internal server error.
         *
         */
        this.router.post(constants.API.V1 + constants.API.AUTH + '/clinic/login', (req: Request, res: Response) => {
            this.clinicLogin(req, res, this);
        });

        /**
         * @swagger
         * /api/v1/auth/patient/login:
         *   post:
         *     tags:
         *       - Auth
         *     summary: Checks patient login.
         *     description: Checks patient login.
         *     requestBody:
         *       description: Patient mobile number.
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *             type: object
         *             properties:
         *               mobile:
         *                 type: string
         *                 description: Mobile of patient.
         *               clinic_id:
         *                 type: string
         *                 description: id of clinic.
         *     responses:
         *       200:
         *         description: User login successful or not.
         *       500:
         *         description: Internal server error.
         *
         */
        this.router.post(constants.API.V1 + constants.API.AUTH + '/patient/login', (req: Request, res: Response) => {
            this.patientLogin(req, res, this);
        });

        /**
         * @swagger
         * /api/v1/auth/patient/verify:
         *   post:
         *     tags:
         *       - Auth
         *     summary: Verify patient login using OTP.
         *     description: Verify patient login using OTP.
         *     requestBody:
         *       description: Patient verification data.
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *             type: object
         *             properties:
         *               mobile:
         *                 type: string
         *                 description: Mobile of patient.
         *               otp:
         *                 type: string
         *                 description: OTP received by patient.
         *     responses:
         *       200:
         *         description: Patient verification successful or not.
         *       500:
         *         description: Internal server error.
         *
         */
        this.router.post(constants.API.V1 + constants.API.AUTH + '/patient/verify', (req: Request, res: Response) => {
            this.verifyPatientLogin(req, res, this);
        });

        /**
         * @swagger
         * /api/v1/auth/refresh:
         *   post:
         *     tags:
         *       - Auth
         *     summary: Generate a refresh token
         *     description: Generates a new refresh token using a valid JWT.
         *     security:
         *       - bearerAuth: []
         *     requestBody:
         *       description: Request body for generating a refresh token.
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *             type: object
         *             properties:
         *               refresh_token:
         *                 type: string
         *                 description: The current refresh token.
         *             required:
         *               - refresh_token
         *     responses:
         *       200:
         *         description: Successfully generated a new refresh token.
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               properties:
         *                 accessToken:
         *                   type: string
         *                   description: The new access token.
         *                 refreshToken:
         *                   type: string
         *                   description: The new refresh token.
         *       400:
         *         description: Invalid or expired refresh token.
         *       500:
         *         description: Internal server error.
         */
        this.router.post(constants.API.V1 + constants.API.AUTH + '/refresh', (req, res) => { this.getRefreshToken(req, res, this) });

        /**
         * @swagger
         * /api/v1/auth/verify/{token}:
         *   get:
         *     tags:
         *       - Auth
         *     summary: Verifies a refresh token using a valid JWT.
         *     description: Verifies a refresh token using a valid JWT.
         *     parameters:
         *       - in: path
         *         name: token
         *         required: true
         *         schema:
         *           type: string
         *           description: File for project image.
         *     responses:
         *       200:
         *         description: Successfully generated a new refresh token.
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               properties:
         *                 valid:
         *                   type: boolean
         *                   description: Returns valid or not
         *       400:
         *         description: Invalid or expired refresh token.
         *       500:
         *         description: Internal server error.
         */
        this.router.get(constants.API.V1 + constants.API.AUTH + '/verify/:token', (req, res) => { this.verifyRefreshToken(req, res, this) });
    }

    private async userLogin(req: Request, res: Response, that: any) {
        try {
            let result: any = await this.authService.userLogin(req.body, req.headers);
            ResponseService.sendResponse(req, res, result, null, result.message, constants.HTTP_STATUS.OK);
        } catch (error: any) {
            LoggerService.log('error', { error: error, message: 'Error in checking user login', location: 'auth-controller => userLogin' });
            ResponseService.sendResponse(req, res, null, error, 'Error in checking user login');
        }
    }

    private async clinicLogin(req: Request, res: Response, that: any) {
        try {
            let result: any = await this.authService.clinicLogin(req.body, req.headers);
            ResponseService.sendResponse(req, res, result, null, result.message, constants.HTTP_STATUS.OK);
        } catch (error: any) {
            LoggerService.log('error', { error: error, message: 'Error in checking clinic login', location: 'auth-controller => clinicLogin' });
            ResponseService.sendResponse(req, res, null, error, 'Error in checking clinic login');
        }
    }

    private async patientLogin(req: Request, res: Response, that: any) {
        try {
            let result: any = await this.authService.patientLogin(req.body, req.headers);
            ResponseService.sendResponse(req, res, result, null, result.message, constants.HTTP_STATUS.OK);
        } catch (error: any) {
            LoggerService.log('error', { error: error, message: 'Error in checking patient login', location: 'auth-controller => patientLogin' });
            ResponseService.sendResponse(req, res, null, error, 'Error in checking patient login');
        }
    }

    private async verifyPatientLogin(req: Request, res: Response, that: any) {
        try {
            let result: any = await this.authService.verifyPatientLogin(req.body, req.headers);
            ResponseService.sendResponse(req, res, result, null, result.message, constants.HTTP_STATUS.OK);
        } catch (error: any) {
            LoggerService.log('error', { error: error, message: 'Error in verifying patient login', location: 'auth-controller => verifyPatientLogin' });
            ResponseService.sendResponse(req, res, null, error, 'Error in verifying patient login');
        }
    }

    private async getRefreshToken(req: Request, res: Response, that: any) {
        try {
            let result: any = await this.authService.getRefreshToken(req.body, req.headers);
            ResponseService.sendResponse(req, res, result, null, result.message, constants.HTTP_STATUS.OK);
        } catch (error: any) {
            LoggerService.log('error', { error: error, message: 'Error in generating refresh token', location: 'auth-ctrl => getRefreshToken' });
            ResponseService.sendResponse(req, res, null, error, 'Error in generating refresh token');
        }
    }

    private async verifyRefreshToken(req: Request, res: Response, that: any) {
        try {
            let result: any = await this.authService.verifyRefreshToken(req.params, req.headers);
            ResponseService.sendResponse(req, res, result, null, result.message, constants.HTTP_STATUS.OK);
        } catch (error: any) {
            LoggerService.log('error', { error: error, message: 'Error in verifying refresh token', location: 'auth-ctrl => verifyRefreshToken' });
            ResponseService.sendResponse(req, res, null, error, 'Error in generating refresh token');
        }
    }
}
