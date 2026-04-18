import { Patient } from 'patient/models/patient';

import LoggerService from 'shared/services/logger-service';

export default class StatusService {
    async getStatus() {
        try {
            let count: any = await Patient.countDocuments();

            return {
                records: count,
                message: 'Server is running'
            }
        } catch (error: any) {
            LoggerService.log('error', { error: error, message: 'Cannot check status', location: 'status-serv => getStatus' });
            throw error;
        }
    }
}