import { Request, Response } from 'express';

import constants from 'utils/constants';
import AuthMiddleware from 'middlewares/auth-middleware';
import LoggerService from 'shared/services/logger-service';
import BaseController from 'shared/controllers/base-controller';

import UserService from 'user/services/user-service';
import { ResponseService } from 'shared/services/response-service';

export default class UserController extends BaseController {
  private readonly userService: UserService;

  constructor() {
    super();

    this.userService = new UserService();
    this.setupRoutes();
  }

  public setupRoutes() {
    /**
     * @swagger
     * /api/v1/users:
     *   post:
     *     tags:
     *       - User
     *     summary: Create a new user.
     *     description: Create a new user.
     *     requestBody:
     *       description: The filter criteria.
     *       required: true
     *       content:
     *           application/json:
     *             schema:
     *               type: object
     *               $ref: '#/components/schemas/UserCreateRequestSchema'
     *     responses:
     *       201:
     *         description: Successfully returns user created success.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               $ref: '#/components/schemas/UserCreateResponseSchema'
     *       500:
     *         description: Internal server error.
     *
     */
    this.router.post(constants.API.V1 + constants.API.USER, this.asyncHandler(AuthMiddleware.verifyJwt), (req: Request, res: Response) => {
      this.createRecord(req, res);
    });

    /**
     * @swagger
     * /api/v1/users/{id}:
     *   get:
     *     tags:
     *       - User
     *     summary: Get user details.
     *     description: Get user details.
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *           description: Id for user.
     *     responses:
     *       200:
     *         description: Successfully returns user details.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 data:
     *                   $ref: '#/components/schemas/UserDetailResponseSchema'
     *       500:
     *         description: Internal server error.
     */
    this.router.get(constants.API.V1 + constants.API.USER + '/:id', this.asyncHandler(AuthMiddleware.verifyJwt), (req: Request, res: Response) => {
      this.findRecord(req, res);
    });

    /**
     * @swagger
     * /api/v1/users/{id}:
     *   put:
     *     tags:
     *       - User
     *     summary: Update a resource
     *     description: Update an existing user by ID.
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         description: The ID of the user to be updated.
     *         schema:
     *           type: string
     *     requestBody:
     *       description: User data to be updated.
     *       required: true
     *       content:
     *           application/json:
     *             schema:
     *               type: object
     *               $ref: '#/components/schemas/UserUpdateRequestSchema'
     *     responses:
     *       200:
     *         description: Successfully updated user.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                   description: Success or failure.
     *       400:
     *         description: Bad user data.
     *       404:
     *         description: User not found.
     *       500:
     *         description: Internal server error.
     */
    this.router.put(constants.API.V1 + constants.API.USER + '/:id', this.asyncHandler(AuthMiddleware.verifyJwt), (req: Request, res: Response) => {
      this.updateRecord(req, res);
    });

    /**
     * @swagger
     * /api/v1/users/{id}:
     *   delete:
     *     tags:
     *       - User
     *     summary: Delete a resource
     *     description: Remove an existing user by ID.
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         description: The ID of the user to be deleted.
     *         schema:
     *           type: string
     *     responses:
     *       204:
     *         description: Successfully updated user.
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
    this.router.delete(constants.API.V1 + constants.API.USER + '/:id', this.asyncHandler(AuthMiddleware.verifyJwt), (req: Request, res: Response) => {
      this.removeRecord(req, res);
    });

    /**
     * @swagger
     * /api/v1/users:
     *   get:
     *     tags:
     *       - User
     *     summary: Read users
     *     description: Read users for the specified endpoint based on given criteria.
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
     *         description: Successfully returns user details.
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/UserListResponseSchema'
     *       500:
     *         description: Internal server error.
     */
    this.router.get(constants.API.V1 + constants.API.USER, this.asyncHandler(AuthMiddleware.verifyJwt), (req: Request, res: Response) => {
      this.filterRecords(req, res);
    });
  }

  private async createRecord(req: Request, res: Response) {
    try {
      let result: any = await this.userService.store(req.body, req.headers);
      ResponseService.sendResponse(req, res, result, null, 'User created', constants.HTTP_STATUS.CREATED);
    } catch (error: any) {
      LoggerService.log('error', { error: error, message: 'Error in creating user', location: 'user-controller => createRecord', data: JSON.stringify(error) });
      ResponseService.sendResponse(req, res, null, error, 'Error in creating user');
    }
  }

  private async filterRecords(req: Request, res: Response) {
    try {
      let result: any = await this.userService.filterRecords(req.query, req.headers);
      ResponseService.sendResponse(req, res, result, null, result.message, constants.HTTP_STATUS.OK);
    } catch (error: any) {
      LoggerService.log('error', { error: error, message: 'Error in filtering users', location: 'user-controller => filterRecords', data: JSON.stringify(error) });
      ResponseService.sendResponse(req, res, null, error, 'Error in filtering user');
    }
  }

  private async findRecord(req: Request, res: Response) {
    try {
      let result: any = await this.userService.findRecord(req.params.id, req.headers);
      if (result) {
        ResponseService.sendResponse(req, res, result, null, 'User found', constants.HTTP_STATUS.OK);
      } else {
        ResponseService.sendResponse(req, res, null, null, 'Not found', constants.HTTP_STATUS.NOT_FOUND);
      }
    } catch (error: any) {
      LoggerService.log('error', { error: error, message: 'Error in finding user', location: 'user-controller => find', data: JSON.stringify(error) });
      ResponseService.sendResponse(req, res, null, error, 'Error in finding user');
    }
  }

  private async updateRecord(req: Request, res: Response) {
    try {
      let result: any = await this.userService.update(req.params.id, req.body, req.headers);
      if (result) {
        ResponseService.sendResponse(req, res, result, null, 'User updated', constants.HTTP_STATUS.OK);
      } else {
        ResponseService.sendResponse(req, res, null, null, 'Not found', constants.HTTP_STATUS.NOT_FOUND);
      }
    } catch (error: any) {
      LoggerService.log('error', { error: error, message: 'Error in updating user', location: 'user-controller => update', data: JSON.stringify(error) });
      ResponseService.sendResponse(req, res, null, error, 'Error in updating user');
    }
  }

  private async removeRecord(req: Request, res: Response) {
    try {
      let result: any = await this.userService.remove(req.params.id, req.headers);
      if (result) {
        ResponseService.sendResponse(req, res, result, null, 'User deleted');
      } else {
        ResponseService.sendResponse(req, res, null, null, 'Not found', constants.HTTP_STATUS.NOT_FOUND);
      }
    } catch (error: any) {
      LoggerService.log('error', { error: error, message: 'Error in removing user', location: 'user-controller => remove', data: JSON.stringify(error) });
      ResponseService.sendResponse(req, res, null, error, 'Error in removing user');
    }
  }
}
