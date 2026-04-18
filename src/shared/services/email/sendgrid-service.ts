import fs from 'fs';
import sgMail from '@sendgrid/mail';
import config from 'config/app-config';
import LoggerService from 'shared/services/logger-service';

export class SendgridService {
    constructor() {
        if (!config.EMAIL.SENDGRID.API_KEY) {
            throw new Error('Sendgrid api key not defined');
        }

        sgMail.setApiKey(config.EMAIL.SENDGRID.API_KEY);
    }

    /**
     *  Sends email
     *  @function
     *  @name sendEmail
     *  @param {JSON} Parameters containing SUBJECT, BODY, TO, BCC, CC etc.
     *  @return {PROMISE}
     */
    async sendEmail(data: any) {
        return new Promise(async (resolve, reject) => {
            let logData = {
                email: data.email,
                subject: data.subject,
                filename: data.hasAttachment ? data.attachment.filePath : '-'
            };

            LoggerService.log('info', { message: 'Sending email', location: 'sendgrid-serv => sendEmail', data: logData });

            let message: any = {
                to: data.email,
                html: data.body,
                subject: data.subject,
                from: config.EMAIL.FROM_EMAIL
            };

            if (data.bcc) {
                message.bcc = data.bcc;
            }

            try {
                if (data.attachments && data.attachments.length > 0) {
                    data.attachments.forEach((attachment: any) => {
                        attachment.disposition = 'attachment';
                        attachment.content = fs.readFileSync(attachment.filePath).toString("base64")
                    });

                    message.attachments = data.attachments;

                    try {
                        let result: any = await sgMail.send(message);

                        LoggerService.log('info', { message: 'Email sent', location: 'sendgrid-serv => sendEmail', result: result });
                        resolve(true);
                    } catch (error: any) {
                        LoggerService.log('error', { error: error, message: 'Cannot send email', location: 'sendgrid-serv => sendEmail' });
                        resolve(false);
                    }
                } else {
                    try {
                        let result: any = await sgMail.send(message);
                        LoggerService.log('debug', { message: 'Email sent', location: 'sendgrid-serv => sendEmail', result: result });

                        resolve(true);
                    } catch (error) {
                        LoggerService.log('error', { error: error, message: 'Cannot send email', location: 'sendgrid-serv => sendEmail' });
                        resolve(false);
                    }
                }
            } catch (error) {
                LoggerService.log('error', { error: error, message: 'Cannot send email', location: 'sendgrid-serv => sendEmail' });
                resolve(false);
            }
        });
    };
}