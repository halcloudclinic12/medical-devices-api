import * as jwt from 'jsonwebtoken';
import appConfig from 'config/app-config';
import EncryptionService from 'shared/services/encryption-service';
import constants from 'utils/constants';
import LoggerService from 'shared/services/logger-service';

export default class JwtService {
    /**
     *  Generates JWT token for given token key
     *  @author Ashutosh Pandey
     *  @function
     *  @name generateToken
     *  @param {String} tokenKey
     *  @return {String} generated token
     */
    static generateToken(id: number, expiresIn: any = null) {
        // get JWT Token and send it back
        let secretKey = appConfig.SERVER_KEYS.SERVER_SECRET;

        const tokenKey = id.toString() + Date.now();

        let data = {
            id: id,
            TOKEN_KEY: tokenKey,
            issuer: appConfig.APP_NAME
        };

        if (!expiresIn) {
            expiresIn = {
                expiresIn: appConfig.JWT_EXPIRY_SECONDS
            };
        }

        let token = jwt.sign(data, secretKey, expiresIn);

        return EncryptionService.encryptWithCrypto(token);
    }

    /**
     *  Generates refresh token
     *  @author Ashutosh Pandey
     *  @function
     *  @name generateRefreshToken
     *  @return {Number} id
     */
    static generateRefreshToken(id: number, expiresIn: any = null) {
        let secretKey = appConfig.SERVER_KEYS.REFRESH_SERVER_SECRET;

        const tokenKey = id.toString() + Date.now();

        let data = {
            id: id,
            TOKEN_KEY: tokenKey,
            issuer: appConfig.APP_NAME
        };

        let token = jwt.sign(data, secretKey, {
            expiresIn: appConfig.JWT_REFRESH_EXPIRY_TIME
        });

        return EncryptionService.encryptWithCrypto(token);
    };

    /**
     *  Verifies refresh token
     *  @author Ashutosh Pandey
     *  @function
     *  @name verifyRefreshToken
     *  @param {String} refreshToken
     */
    static async verifyRefreshToken(refreshToken: string): Promise<{ valid: boolean; id?: string; message?: string }> {
        if (!refreshToken) {
            return {
                valid: false,
                message: 'No token provided.',
            };
        }

        try {
            // Ensure the secret key is available
            const secretKey = appConfig.SERVER_KEYS.REFRESH_SERVER_SECRET;
            if (!secretKey) {
                return {
                    valid: false,
                    message: constants.MESSAGES.ERRORS.INVALID_AUTH_TOKEN,
                };
            }

            // Decrypt the refresh token
            const decryptedToken = EncryptionService.decryptWithCrypto(refreshToken);

            // Verify the token and extract the payload
            const payload: any = jwt.verify(decryptedToken, secretKey);

            return {
                valid: true,
                id: payload.id,
            };
        } catch (error: any) {
            LoggerService.log('error', { error: error, message: 'Error in verifying refresh token', location: 'jwt-service => verifyRefreshToken' });
            return {
                valid: false
            };
        }
    }

    /**
     *  Verify JWT token for given token key
     *  @author Ashutosh Pandey
     *  @function
     *  @name verifyJWTToken
     *  @param {String} authToken
     */
    static async verifyToken(authToken: any) {
        if (!authToken) {
            return {
                valid: false,
                message: constants.MESSAGES.ERRORS.INVALID_AUTH_TOKEN,
            };
        }

        let secretKey = appConfig.SERVER_KEYS.SERVER_SECRET;
        if (!secretKey) {
            return {
                valid: false,
                message: constants.MESSAGES.ERRORS.SERVER_SECRET_MISSING,
            };
        }

        try {
            const token = authToken.startsWith('Bearer ') ? authToken.split(' ')[1] : authToken;
            let decryptedToken = EncryptionService.decryptWithCrypto(token);
            const decoded: any = jwt.verify(decryptedToken, secretKey);
            if (decoded) {
                return {
                    valid: true,
                    id: decoded.id
                }
            } else {
                return {
                    valid: false
                };
            }
        } catch (error: any) {
            LoggerService.log('error', { error: error, message: 'Error in verifying auth token', location: 'jwt-service => verifyToken' });
            throw error;
        }
    }

    /**
     *  Get id from token
     *  @author Ashutosh Pandey
     *  @function
     *  @name getIdFromToken
     *  @return {String} authToken
     */
    static async getIdFromToken(authToken: any) {
        if (!authToken) {
            return {
                valid: false,
                message: constants.MESSAGES.ERRORS.INVALID_AUTH_TOKEN,
            };
        }

        let secretKey = appConfig.SERVER_KEYS.SERVER_SECRET;
        if (!secretKey) {
            return {
                valid: false,
                message: constants.MESSAGES.ERRORS.SERVER_SECRET_MISSING,
            };
        }

        try {
            const token = authToken.startsWith('Bearer ') ? authToken.split(' ')[1] : authToken;

            let decryptedToken = EncryptionService.decryptWithCrypto(token);
            const decoded: any = jwt.verify(decryptedToken, secretKey);

            if (decoded) {
                return {
                    valid: true,
                    id: decoded.id
                }
            } else {
                return {
                    valid: false
                };
            }
        } catch (error: any) {
            LoggerService.log('error', { error: error, message: 'Error in extracting id from token', location: 'jwt-service => getIdFromToken' });
            throw error;
        }
    };
}