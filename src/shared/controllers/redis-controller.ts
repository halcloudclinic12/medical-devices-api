import * as express from 'express';
import { Request, Response } from 'express';

import constants from '../../utils/constants';
import LoggerService from '../services/logger-service';
import AuthMiddleware from '../../middlewares/auth-middleware';

import { RedisService } from '../services/redis-service';
import { ResponseService } from '../services/response-service';

export class RedisController {
    public readonly router = express.Router();
    public readonly responseService: ResponseService;

    constructor() {
        this.responseService = new ResponseService();

        this.initializeRoutes();
    }

    /**
     * @function initializeRoutes
     * Initializes API routes
     */
    public initializeRoutes() {
        /**
         * @swagger
         * /api/v1/redus/status:
         *   get:
         *     tags:
         *       - Redis
         *     summary: Get redis status
         *     description: Get redis status
         *     security:
         *       - bearerAuth: [] # Use the bearerAuth scheme
         *     responses:
         *       200:
         *         description: Successfully returns redis status.
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               properties:
         *                 data:
         *                   properties:
         *                     total_keys:
         *                       type: integer
         *                       description: Number of keys in Redis.
         *                     used_memory:
         *                       type: string
         *                       description: Memory used by Redis.
         *       500:
         *         description: Internal server error.
         */
        this.router.get(constants.API.V1 + constants.API.REDIS + '/status', AuthMiddleware.verifyJwt, (req, res) => { this.getRedisStatus(req, res, this) });

        /**
         * @swagger
         * /api/v1/redus/flush:
         *   get:
         *     tags:
         *       - Redis
         *     summary: Flushes redis cache
         *     description: Flushes redis cache
         *     security:
         *       - bearerAuth: [] # Use the bearerAuth scheme
         *     responses:
         *       200:
         *         description: Flushes redis cache
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               properties:
         *                 data:
         *                   properties:
         *                     total_keys:
         *                       type: integer
         *                       description: Number of keys in Redis.
         *                     used_memory:
         *                       type: string
         *                       description: Memory used by Redis.
         *       500:
         *         description: Internal server error.
         */
        this.router.get(constants.API.V1 + constants.API.REDIS + '/flush', AuthMiddleware.verifyJwt, (req, res) => { this.flushRedisCache(req, res, this) });
    }

    private async getRedisStatus(req: Request, res: Response, that: any) {
        try {
            let result = await RedisService.getInstance()?.getRedisStatus();
            that.responseUtil.sendReadResponse(req, res, result, 200);
        } catch (error: any) {
            LoggerService.log('error', { error: error, message: 'Error in getting redis status', location: 'redis-ctrl => getRedisStatus' });
            that.responseUtil.sendFailureResponse(req, res, error, { fileName: 'redis-ctrl', methodName: 'getRedisStatus' }, 200);
        }
    }

    private async flushRedisCache(req: Request, res: Response, that: any) {
        try {
            let result = await RedisService.getInstance()?.flushRedisCache();
            that.responseUtil.sendReadResponse(req, res, result, 200);
        } catch (error: any) {
            LoggerService.log('error', { error: error, message: 'Error in flushing redis cache', location: 'redis-ctrl => flushRedisCache' });
            that.responseUtil.sendFailureResponse(req, res, error, { fileName: 'redis-ctrl', methodName: 'flushRedisCache' }, 200);
        }
    }
}

export default RedisController;