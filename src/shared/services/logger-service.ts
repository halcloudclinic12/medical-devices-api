import logger from 'config/logger-config';

export default class LoggerService {
    static log(level: string, data: any) {
        if (data && level) {
            data.time = new Date();

            if (data.error) {
                const serializedError = {
                    message: data.error.message
                };

                data.error = serializedError;
            }

            logger.log(level, data);
        }
    }
}