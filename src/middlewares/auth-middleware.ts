import JwtService from 'auth/services/jwt-service';

export default class AuthMiddleware {
    public static async verifyJwt(req: any, res: any, next: any) {
        if (req.headers.authorization) {
            let token: string = req.headers.authorization;
            if (token) {
                try {
                    let result: any = await JwtService.verifyToken(token);
                    if (result && result.valid) {
                        req.headers.loggeduserid = result.id;
                        next();
                    } else {
                        res.status(401).json({ message: 'Unauthorized' });
                    }
                } catch (error: any) {
                    res.status(401).json({ message: 'Unauthorized', details: error.message });
                }
            } else {
                res.status(401).json({ message: 'Unauthorized', details: 'No authorization token provided' });
            }
        } else {
            res.status(401).json({ message: 'Unauthorized', details: 'No authorization token provided' });
        }
    }

    public static addLoggedUser(req: any, res: any, next: any) {
        if (req.headers.authorization) {
            let token: string = req.headers.authorization;
            if (token) {
                JwtService.verifyToken(token).then((result: any) => {
                    if (result && result.valid) {
                        req.headers.loggeduserid = result.id;
                        next();
                    } else {
                        next();
                    }
                }).catch((err: any) => {
                    next();
                });
            } else {
                next();
            }
        } else {
            next();
        }
    }
}
