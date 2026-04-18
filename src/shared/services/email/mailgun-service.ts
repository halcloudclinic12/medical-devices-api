import fs from 'fs';
import formData from 'form-data';
import Mailgun from 'mailgun.js';
import config from 'config/app-config';
import LoggerService from 'shared/services/logger-service';

export class MailgunService {
    private client: any;
    private domain: string;

    constructor() {
        if (!config.EMAIL.MAILGUN.API_KEY || !config.EMAIL.MAILGUN.DOMAIN) {
            throw new Error('Mailgun API key or domain not defined');
        }

        const mailgun = new Mailgun(formData);
        this.client = mailgun.client({
            username: 'api',
            key: config.EMAIL.MAILGUN.API_KEY,
            url: 'https://api.eu.mailgun.net'
        });

        this.domain = config.EMAIL.MAILGUN.DOMAIN;
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
            const logData = {
                email: data.email,
                subject: data.subject,
                filename: data.hasAttachment ? data.attachment?.filePath : '-'
            };

            LoggerService.log('info', { message: 'Sending email', location: 'mailgun-serv => sendEmail', data: logData });

            let message: any = {
                from: config.EMAIL.FROM_EMAIL,
                to: data.email,
                subject: data.subject,
                html: data.body
            };

            if (data.bcc) {
                message.bcc = data.bcc;
            }

            try {
                if (data.attachments && data.attachments.length > 0) {
                    message.attachment = data.attachments.map((attachment: any) => {
                        return {
                            filename: attachment.filename || 'attachment',
                            data: fs.createReadStream(attachment.filePath)
                        };
                    });
                }

                let result = await this.client.messages.create(this.domain, message);

                LoggerService.log('info', { message: 'Email sent', location: 'mailgun-serv => sendEmail', result: result });
                resolve(true);
            } catch (error) {
                LoggerService.log('error', { error: error, message: 'Cannot send email', location: 'mailgun-serv => sendEmail' });
                resolve(false);
            }
        });
    }
}
