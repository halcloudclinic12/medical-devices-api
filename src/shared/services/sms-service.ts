import https from 'https';
import axios from 'axios';
import config from 'config/app-config';
import LoggerService from './logger-service';

export class SmsService {
    async send(data: any) {
        if (!config.SMS.ENABLED) {
            return {
                skipped: true
            };
        }

        let smsApiKey;
        let smsSender;

        if (data.config) {
            smsApiKey = data.config.sms_key;
            smsSender = data.config.sms_sender;
        } else {
            smsApiKey = config.SMS.API.KEY;
            smsSender = config.SMS.API.SENDER_NAME;
        }

        let smsUrl = config.SMS.API.URL;
        if (!smsUrl) {
            throw 'Invalid sms api url';
        }

        let logData = { url: smsUrl, phoneNumber: data.mobile.slice(0, -6) + 'x'.repeat(6), body: data.body };
        LoggerService.log('debug', { message: 'Sms sending request', location: 'sms-service => send', data: logData });

        smsUrl += '/send?apikey=' + smsApiKey + '&sender=' + smsSender;
        smsUrl += '&numbers=' + data.mobile + '&message=' + data.body;

        return await this.sendSmsNow(smsUrl);
    }

    async getShortenedUrl(smsUrl: string) {
        let apiKey = config.SMS.API.KEY;
        if (!apiKey) {
            throw 'Invalid sms api key';
        }

        // Prepare data for POST request
        let data: any = `${'apikey'}=${encodeURIComponent(apiKey)}&${'url'}=${smsUrl}`;

        const response = await axios.post('https://api.textlocal.in/create_shorturl/', data, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });

        const json = response.data;
        LoggerService.log('debug', { message: 'Shortened sms result', location: 'sms-util => getShortenedUrl', data: json });

        if (json.status == 'success') {
            return json.shorturl;
        } else {
            throw json;
        }
    }

    async sendSmsNow(smsUrl: string) {
        return new Promise((resolve, reject) => {
            try {
                https.get(smsUrl, (response: any) => {
                    let data = '';

                    // A chunk of data has been recieved.
                    response.on('data', (chunk: any) => {
                        data += chunk;
                    });

                    // The whole response has been received. Print out the result.
                    response.on('end', () => {
                        try {
                            LoggerService.log('debug', { message: 'Sms sent successfully', location: 'sms-util => sendSmsNow' });
                            resolve(true);
                        } catch (error) {
                            LoggerService.log('error', { error: error, message: 'Error in sending sms', location: 'sms-util => sendSmsNow' });
                            throw error;
                        }
                    });
                }).on('error', (error: any) => {
                    LoggerService.log('error', { error: error, message: 'Cannot send sms', location: 'sms-util => sendSmsNow' });
                    throw error;
                });
            } catch (error) {
                LoggerService.log('error', { error: error, message: 'Error in sending sms', location: 'sms-util => sendSmsNow' });
                throw error;
            }
        });
    }
}