import * as express from 'express';

export default class BaseController {
    public readonly router = express.Router();

    asyncHandler(fn: Function) {
        return (req: any, res: any, next: any) => {
            Promise.resolve(fn(req, res, next)).catch(next);
        };
    }
}