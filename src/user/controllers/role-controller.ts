import { Request, Response } from 'express';

import constants from 'utils/constants';
import AuthMiddleware from 'middlewares/auth-middleware';
import LoggerService from 'shared/services/logger-service';
import BaseController from 'shared/controllers/base-controller';

import RoleService from 'user/services/role-service';
import { ResponseService } from 'shared/services/response-service';
import validateCreateRole from 'user/validations/role-create-validator';

export default class RoleController extends BaseController {
  private readonly roleService: RoleService;

  constructor() {
    super();

    this.roleService = new RoleService();
    this.setupRoutes();
  }

  public setupRoutes() {
    /**
     * @swagger
     * /api/v1/roles:
     *   post:
     *     tags:
     *       - Role
     *     summary: Create a new role.
     *     description: Create a new role.
     *     requestBody:
     *       description: Request body for creating role.
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               name:
     *                 type: string
     *                 description: Page number for pagination.
     *               description:
     *                 type: string
     *                 description: Number of records to fetch.
     *     responses:
     *       201:
     *         description: Role created successfully.
     *       500:
     *         description: Internal server error.
     *
     */
    this.router.post(constants.API.V1 + constants.API.ROLE, validateCreateRole, this.asyncHandler(AuthMiddleware.verifyJwt), (req: Request, res: Response) => {
      this.createRecord(req, res);
    });

    /**
     * @swagger
     * /api/v1/roles/{id}:
     *   get:
     *     tags:
     *       - Role
     *     summary: Get role details.
     *     description: Get role details.
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *           description: Id for role.
     *     responses:
     *       200:
     *         description: Successfully returns role details.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 data:
     *                   $ref: '#/components/schemas/RoleDetails'
     *       500:
     *         description: Internal server error.
     */
    this.router.get(constants.API.V1 + constants.API.ROLE + '/:id', this.asyncHandler(AuthMiddleware.verifyJwt), (req: Request, res: Response) => {
      this.findRecord(req, res);
    });

    /**
     * @swagger
     * /api/v1/roles/{id}:
     *   put:
     *     tags:
     *       - Role
     *     summary: Update a resource
     *     description: Update an existing role by ID.
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         description: The ID of the role to be updated.
     *         schema:
     *           type: string
     *     requestBody:
     *       description: Request body for updating role.
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               name:
     *                 type: string
     *                 description: Page number for pagination.
     *               description:
     *                 type: string
     *                 description: Number of records to fetch.
     *     responses:
     *       200:
     *         description: Role updated successfully.
     *       400:
     *         description: Bad role data.
     *       404:
     *         description: Role not found.
     *       500:
     *         description: Internal server error.
     */
    this.router.put(constants.API.V1 + constants.API.ROLE + '/:id', this.asyncHandler(AuthMiddleware.verifyJwt), (req: Request, res: Response) => {
      this.updateRecord(req, res);
    });

    /**
     * @swagger
     * /api/v1/roles/{id}:
     *   delete:
     *     tags:
     *       - Role
     *     summary: Delete a resource
     *     description: Remove an existing role by ID.
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         description: The ID of the role to be deleted.
     *         schema:
     *           type: string
     *     responses:
     *       204:
     *         description: Resource deleted successfully.
     *       404:
     *         description: Resource not found.
     *       500:
     *         description: Internal server error.
     * 
     */
    this.router.delete(constants.API.V1 + constants.API.ROLE + '/:id', this.asyncHandler(AuthMiddleware.verifyJwt), (req: Request, res: Response) => {
      this.removeRecord(req, res);
    });

    /**
     * @swagger
     * /api/v1/roles:
     *   get:
     *     tags:
     *       - Role
     *     summary: Read roles
     *     description: Read roles for the specified endpoint based on given criteria.
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
     *               $ref: '#/components/schemas/RoleListResponseSchema'
     *       500:
     *         description: Internal server error.
     */
    this.router.get(constants.API.V1 + constants.API.ROLE, this.asyncHandler(AuthMiddleware.verifyJwt), (req: Request, res: Response) => {
      this.filterRecords(req, res);
    });

    /**
     * @swagger
     * /api/v1/roles/assign:
     *   post:
     *     tags:
     *       - Role
     *     summary: Assign role to a user.
     *     description: Assign role to a user.
     *     requestBody:
     *       description: Request body for assigning role.
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               name:
     *                 type: string
     *                 description: Page number for pagination.
     *               description:
     *                 type: string
     *                 description: Number of records to fetch.
     *     responses:
     *       201:
     *         description: Role created successfully.
     *       500:
     *         description: Internal server error.
     *
     */
    this.router.post(constants.API.V1 + constants.API.ROLE, validateCreateRole, this.asyncHandler(AuthMiddleware.verifyJwt), (req: Request, res: Response) => {
      this.createRecord(req, res);
    });
  }

  private async createRecord(req: Request, res: Response) {
    try {
      let result: any = await this.roleService.store(req.body, req.headers);
      ResponseService.sendResponse(req, res, result, null, 'Role created', constants.HTTP_STATUS.CREATED);
    } catch (error: any) {
      LoggerService.log('error', { error: error, message: 'Error in creating role', location: 'role-controller => createRecord', data: JSON.stringify(error) });
      ResponseService.sendResponse(req, res, null, error, 'Error in creating role');
    }
  }

  private async filterRecords(req: Request, res: Response) {
    try {
      let result: any = await this.roleService.filterRecords(req.query, req.headers);
      ResponseService.sendResponse(req, res, result, null, result.message, constants.HTTP_STATUS.OK);
    } catch (error: any) {
      LoggerService.log('error', { error: error, message: 'Error in filtering roles', location: 'role-controller => filterRecords', data: JSON.stringify(error) });
      ResponseService.sendResponse(req, res, null, error, 'Error in filtering role');
    }
  }

  private async findRecord(req: Request, res: Response) {
    try {
      let result: any = await this.roleService.findRecord(req.params.id, req.headers);
      if (result) {
        ResponseService.sendResponse(req, res, result, null, 'Role found', constants.HTTP_STATUS.OK);
      } else {
        ResponseService.sendResponse(req, res, null, null, 'Not found', constants.HTTP_STATUS.NOT_FOUND);
      }
    } catch (error: any) {
      LoggerService.log('error', { error: error, message: 'Error in finding role', location: 'role-controller => find', data: JSON.stringify(error) });
      ResponseService.sendResponse(req, res, null, error, 'Error in finding role');
    }
  }

  private async updateRecord(req: Request, res: Response) {
    try {
      let result: any = await this.roleService.update(req.params.id, req.body, req.headers);
      if (result) {
        ResponseService.sendResponse(req, res, result, null, 'Role updated', constants.HTTP_STATUS.OK);
      } else {
        ResponseService.sendResponse(req, res, null, null, 'Not found', constants.HTTP_STATUS.NOT_FOUND);
      }
    } catch (error: any) {
      LoggerService.log('error', { error: error, message: 'Error in updating role', location: 'role-controller => update', data: JSON.stringify(error) });
      ResponseService.sendResponse(req, res, null, error, 'Error in updating role');
    }
  }

  private async removeRecord(req: Request, res: Response) {
    try {
      let result: any = await this.roleService.remove(req.params.id, req.headers);
      if (result) {
        ResponseService.sendResponse(req, res, result, null, 'Role deleted');
      } else {
        ResponseService.sendResponse(req, res, null, null, 'Not found', constants.HTTP_STATUS.NOT_FOUND);
      }
    } catch (error: any) {
      LoggerService.log('error', { error: error, message: 'Error in removing role', location: 'role-controller => remove', data: JSON.stringify(error) });
      ResponseService.sendResponse(req, res, null, error, 'Error in removing role');
    }
  }
}
