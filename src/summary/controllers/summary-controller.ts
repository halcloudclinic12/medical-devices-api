import { Request, Response } from 'express';

import constants from 'utils/constants';
import AuthMiddleware from 'middlewares/auth-middleware';
import LoggerService from 'shared/services/logger-service';
import { ResponseService } from 'shared/services/response-service';

import SummaryService from 'summary/services/summary-service';
import BaseController from 'shared/controllers/base-controller';

export default class SummaryController extends BaseController {
    private readonly summaryService: SummaryService;

    constructor() {
        super();

        this.summaryService = new SummaryService();
        this.setupRoutes();
    }

    public setupRoutes() {
        /**
         * @swagger
         * /api/v1/summary:
         *   get:
         *     tags:
         *       - Summary
         *     summary: Return summary data.
         *     description: Calculates summary on data.
         *     parameters:
         *       - in: query
         *         name: from_date
         *         schema:
         *           type: string
         *           format: date
         *         required: false
         *         description: Start date in 'YYYY-MM-DD' format
         *       - in: query
         *         name: to_date
         *         schema:
         *           type: string
         *           format: date
         *         required: false
         *         description: End date in 'YYYY-MM-DD' format
         *       - in: query
         *         name: gender
         *         schema:
         *           type: string
         *           enum: [male, female, none]
         *         required: false
         *         description: Filter by gender
         *       - in: query
         *         name: age_group
         *         schema:
         *           type: string
         *         required: false
         *         description: Filter by age group range (e.g., '1-18', '19-30')
         *     responses:
         *       200:
         *         description: Successfully returns summary.
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               properties:
         *                 data:
         *                   $ref: '#/components/schemas/SummaryResponseSchema'
         *       500:
         *         description: Internal server error.
         */
        this.router.get(constants.API.V1 + constants.API.SUMMARY, this.asyncHandler(AuthMiddleware.verifyJwt), (req: Request, res: Response) => {
            this.getSummary(req, res, this);
        });
        /**
         * @swagger
         * /api/v1/summary/data:
         *   get:
         *     tags:
         *       - Summary
         *     summary: Return summary data.
         *     description: Calculates summary on data.
         *     parameters:
         *       - in: query
         *         name: from_date
         *         schema:
         *           type: string
         *           format: date
         *         required: false
         *         description: Start date in 'YYYY-MM-DD' format
         *       - in: query
         *         name: to_date
         *         schema:
         *           type: string
         *           format: date
         *         required: false
         *         description: End date in 'YYYY-MM-DD' format
         *       - in: query
         *         name: gender
         *         schema:
         *           type: string
         *           enum: [male, female, none]
         *         required: false
         *         description: Filter by gender
         *       - in: query
         *         name: age_group
         *         schema:
         *           type: string
         *         required: false
         *         description: Filter by age group range (e.g., '1-18', '19-30')
         *     responses:
         *       200:
         *         description: Successfully returns summary.
         *       500:
         *         description: Internal server error.
         */
        this.router.get(constants.API.V1 + constants.API.SUMMARY + '/data', this.asyncHandler(AuthMiddleware.verifyJwt), (req: Request, res: Response) => {
            this.getDataSummary(req, res, this);
        });

        /**
         * @swagger
         * /api/v1/summary/patients:
         *   get:
         *     tags:
         *       - Summary
         *     summary: Return summary grouped data.
         *     description: Calculates summary grouped on data.
         *     responses:
         *       200:
         *         description: Successfully returns summary grouped.
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               properties:
         *                 data:
         *                   $ref: '#/components/schemas/SummaryGroupedResponseSchema'
         *       500:
         *         description: Internal server error.
         */
        this.router.get(constants.API.V1 + constants.API.SUMMARY + '/patients', this.asyncHandler(AuthMiddleware.verifyJwt), (req: Request, res: Response) => {
            this.getSummaryPatients(req, res, this);
        });

        /**
         * @swagger
         * /api/v1/summary/tests:
         *   get:
         *     tags:
         *       - Summary
         *     summary: Return summary grouped data.
         *     description: Calculates summary grouped on data.
         *     responses:
         *       200:
         *         description: Successfully returns summary grouped.
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               properties:
         *                 data:
         *                   $ref: '#/components/schemas/SummaryGroupedResponseSchema'
         *       500:
         *         description: Internal server error.
         */
        this.router.get(constants.API.V1 + constants.API.SUMMARY + '/tests', this.asyncHandler(AuthMiddleware.verifyJwt), (req: Request, res: Response) => {
            this.getSummaryTests(req, res, this);
        });
    }

    private async getSummary(req: Request, res: Response, that: any) {
        try {
            let result: any = await this.summaryService.getSummary(req.body, req.headers);
            ResponseService.sendResponse(req, res, result, null, 'Summary grouped data', constants.HTTP_STATUS.OK);
        } catch (error: any) {
            LoggerService.log('error', { error: error, message: 'Error in returning summary ', location: 'summary-controller => filter' });
            ResponseService.sendResponse(req, res, null, error, 'Error in returning summary');
        }
    }

    private async getDataSummary(req: Request, res: Response, that: any) {
        try {
            let result: any = await this.summaryService.getDataSummary(req.query);
            ResponseService.sendResponse(req, res, result, null, 'Summary grouped data', constants.HTTP_STATUS.OK);
        } catch (error: any) {
            LoggerService.log('error', { error: error, message: 'Error in returning summary ', location: 'summary-controller => filter' });
            ResponseService.sendResponse(req, res, null, error, 'Error in returning summary');
        }
    }

    private async getSummaryPatients(req: Request, res: Response, that: any) {
        try {
            let result: any = await this.summaryService.getSummaryPatients(req.query, req.headers);
            ResponseService.sendResponse(req, res, result, null, 'Patient summary grouped data', constants.HTTP_STATUS.OK);
        } catch (error: any) {
            LoggerService.log('error', { error: error, message: 'Error in returning summary ', location: 'summary-controller => getSummaryPatients' });
            ResponseService.sendResponse(req, res, null, error, 'Error in returning patient summary');
        }
    }

    private async getSummaryTests(req: Request, res: Response, that: any) {
        try {
            let result: any = await this.summaryService.getSummaryTests(req.query, req.headers);
            ResponseService.sendResponse(req, res, result, null, 'Patient summary grouped data', constants.HTTP_STATUS.OK);
        } catch (error: any) {
            LoggerService.log('error', { error: error, message: 'Error in returning summary ', location: 'summary-controller => getSummaryTests' });
            ResponseService.sendResponse(req, res, null, error, 'Error in returning test summary');
        }
    }
}