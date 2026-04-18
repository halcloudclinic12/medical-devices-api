import config from 'config/app-config';
import constants from 'utils/constants';

import FileService from './file-service';
import { MailgunService } from './email/mailgun-service';
import LoggerService from 'shared/services/logger-service';
import { SendgridService } from 'shared/services/email/sendgrid-service';

export default class EmailService {
    private readonly fileService: FileService;

    constructor() {
        this.fileService = new FileService();
    }

    /**
     *  Sends email
     *  @function
     *  @name sendEmail
     *  @param {JSON} Parameters containing SUBJECT, BODY, TO, BCC, CC etc.
     *  @return {STRING} Full name
     */
    async sendEmail(data: any) {
        if (!config.EMAIL.ENABLED) {
            return {
                skipped: true
            };
        }

        if (!config.EMAIL.EMAIL_SERVICE) {
            throw new Error('Email service not configured');
        }

        if (config.EMAIL.EMAIL_SERVICE.toLowerCase() == constants.EMAILS.SERVICE_SENDGRID.toLowerCase()) {
            return new SendgridService().sendEmail(data);
        } else if (config.EMAIL.EMAIL_SERVICE.toLowerCase() == constants.EMAILS.SERVICE_MAILGUN.toLowerCase()) {
            return new MailgunService().sendEmail(data);
        } else {
            LoggerService.log('error', { message: constants.MESSAGES.ERRORS.NO_EMAIL_PROVIDER_CONFIGURED });
            return Promise.reject({
                error: true,
                message: constants.MESSAGES.ERRORS.NO_EMAIL_PROVIDER_CONFIGURED
            });
        }
    };

    /**
     *  Sends verification email
     *  @function
     *  @name sendVerificationEmail
     *  @param {JSON} Parameters containing ticket information
     */
    async sendVerificationEmail(data: any, subject: string) {
        let emailData: any = {
            email: data.email,
            subject: subject,
            body: data.body
        };

        return await this.sendEmail(emailData);
    }

    /**
     *  Sends registration welcome email
     *  @function
     *  @name sendRegistrationWelcomeEmail
     *  @param {JSON} Parameters containing ticket information
     */
    async sendRegistrationWelcomeEmail(data: any, subject: string) {
        let emailData: any = {
            email: data.email,
            subject: subject,
            body: data.body
        };

        return await this.sendEmail(emailData);
    }

    /**
     *  Sends forgot password email
     *  @function
     *  @name sendForgotPasswordEmail
     *  @param {JSON} Parameters containing ticket information
     */
    async sendForgotPasswordEmail(data: any, subject: string, hasAttachment: boolean = false) {
        let emailData: any = {
            email: data.email,
            subject: subject,
            body: data.body
        };

        return await this.sendEmail(emailData);
    }

    /**
     *  Sends exception email
     *  @function
     *  @name sendExceptionEmail
     *  @param {JSON} Parameters containing ticket information
     */
    async sendExceptionEmail(data: any) {
        data['env'] = config.ENV_NAME;

        let to = config.EMAIL.EXCEPTION_NOTIFICATION_EMAIL;
        let subject = '(' + data['env'] + ')' + constants.MESSAGES.APPLICATION_EXCEPTION;

        let template = await this.fileService.getTemplate(data, constants.TEMPLATES.EXCEPTION);

        let emailData: any = {
            to: to,
            html: template,
            subject: subject
        };

        return this.sendEmail(emailData);
    }
}