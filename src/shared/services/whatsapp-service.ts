import appConfig from 'config/app-config';
import LoggerService from './logger-service';
const Gupshup = require('gupshup-whatsapp-api');

export class WhatsappService {
    async send(data: any) {
        return new Promise((resolve, reject) => {
            let apiKey: string;
            let appName: string;
            let fromPhoneNumber: string;

            if (data.config) {
                apiKey = data.config.whatsapp_api_key;
                appName = data.config.whatsapp_app_name;
                fromPhoneNumber = data.config.whatsapp_sender
            } else {
                apiKey = appConfig.WHATSAPP.API_KEY;
                appName = appConfig.WHATSAPP.APP_NAME;
                fromPhoneNumber = appConfig.WHATSAPP.FROM_PHONE_NUMBER;
            }

            let client = new Gupshup({
                apiKey: apiKey
            });

            let logData = {
                text: data.text,
                fileName: data.fileName,
                mobileToLog: data.mobile.slice(0, -5) + 'x'.repeat(6)
            };

            LoggerService.log('debug', { message: 'Sending Whatsapp message sent', location: 'whatsapp-service => send', data: logData });

            client.message.send({
                channel: "whatsapp",
                'src.name': appName,
                source: fromPhoneNumber,
                destination: data.mobile,
                message: {
                    type: "file",
                    isHSM: "false",
                    caption: data.text,
                    url: data.reportUrl,
                    filename: data.fileName
                }
            }).then((response: any) => {
                LoggerService.log('debug', { message: 'Whatsapp message sent', location: 'whatsapp-service => sendMessage', data: response });
                resolve(response);
            }).catch((error: any) => {
                LoggerService.log('error', { error: error, message: 'Error in sending whatsapp', location: 'whatsapp-service => sendMessage' });
                reject(error);
            });
        });
    }
}