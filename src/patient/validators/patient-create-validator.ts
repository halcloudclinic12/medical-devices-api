import { NextFunction, Request, Response } from 'express';

import constants from "utils/constants";

const { body, validationResult } = require('express-validator');

const validateCreatePatient = [
    body('name').isString().withMessage('Name is invalid'),
    body('email').optional().isEmail().withMessage('Invalid email format'),
    body('mobile').isMobilePhone().withMessage('Invalid mobile number'),
    body('gender').isString().withMessage('Invalid gender'),

    (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const formattedErrors = errors.array().map((err: any) => ({
                message: err.msg,
                field: err.param,
            }));

            return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({ errors: formattedErrors });
        }
        next();
    },
];

export default validateCreatePatient;