import path from 'path';
import dotenv from 'dotenv';

// initialize configuration
if (process.env.ENV_NAME !== 'k8') {
    dotenv.config(); // Load from .env if not running in kubernetes
}

let rootPath = path.join(__dirname, '..');

export default {
    ROOT: rootPath,
    ENV_NAME: process.env.ENV_NAME,
    SERVER_ROOT: process.env.SERVER_ROOT,
    APP_NAME: process.env.APP_NAME || '',
    DOMAIN_URL: process.env.DOMAIN_URL || null,
    ALLOW_CRON: process.env.ALLOW_CRON || false,
    LOG_LEVEL: process.env.LOG_LEVEL || 'debug',
    SERVER_PORT: process.env.SERVER_PORT || 3000,
    DB_CONNECTION: process.env.DB_CONNECTION || '',
    WHITE_LISTED_URLS: process.env.WHITE_LISTED_URLS || null,
    JWT_REFRESH_EXPIRY_TIME: process.env.JWT_REFRESH_EXPIRY_TIME,
    DEFAULT_USER_PASSWORD: process.env.DEFAULT_USER_PASSWORD || '12345',
    ENCRYPTION_ALGORITHM: process.env.ENCRYPTION_ALGORITHM || 'aes-256-ctr',
    JWT_EXPIRY_SECONDS: parseInt(process.env.JWT_EXPIRY_SECONDS || '3600', 10),
    IS_EXCEPTION_EMAIL_ENABLED: process.env.IS_EXCEPTION_EMAIL_ENABLED || false,
    IS_OTP_VERIFICATION_ENABLED: process.env.IS_OTP_VERIFICATION_ENABLED || false,
    SERVER_KEYS: {
        SERVER_SECRET: process.env.SERVER_SECRET,
        REFRESH_SERVER_SECRET: process.env.REFRESH_SERVER_SECRET
    },
    EMAIL: {
        FROM_EMAIL: process.env.FROM_EMAIL,
        HELP_EMAIL: process.env.HELP_EMAIL,
        ADMIN_EMAIL: process.env.ADMIN_EMAIL,
        EMAIL_SERVICE: process.env.EMAIL_SERVICE,
        ENABLED: process.env.EMAIL_ENABLED == 'true',
        EXCEPTION_NOTIFICATION_EMAIL: process.env.EXCEPTION_NOTIFICATION_EMAIL,
        USE_PROVIDER_EMAIL_TEMPLATES: process.env.USE_PROVIDER_EMAIL_TEMPLATES || false,

        FORGOT_PASSWORD_EMAIL_TEMPLATE_ID: process.env.REGISTRATION_WELCOME_EMAIL_TEMPLATE_ID,
        REGISTRATION_WELCOME_EMAIL_TEMPLATE_ID: process.env.REGISTRATION_WELCOME_EMAIL_TEMPLATE_ID,

        MAILGUN: {
            DOMAIN: process.env.MAILGUN_DOMAIN,
            API_KEY: process.env.MAILGUN_API_KEY,
        },
        SENDGRID: {
            API_KEY: process.env.SENDGRID_API_KEY,
        },
    },
    SMS: {
        ENABLED: process.env.SMS_ENABLED == 'true',
        SERVICE_TYPE: process.env.SMS_SERVICE_TYPE,      // api, twilio
        API: {
            KEY: process.env.SMS_KEY,
            URL: process.env.SMS_API_URL,
            SENDER_NAME: process.env.SENDER_NAME
        },

        TWILIO: {
            SID: process.env.TWILIO_SID
        }
    },
    WHATSAPP: {
        API_KEY: process.env.WHATSAPP_API_KEY,
        APP_NAME: process.env.WHATSAPP_APP_NAME,
        FROM_PHONE_NUMBER: process.env.WHATSAPP_FROM_PHONE_NUMBER
    },
    RATE_LIMIT: {
        MAX_REQUEST_COUNT: parseInt(process.env.RATE_LIMITER_MAX_REQUEST_COUNT ?? '200', 10),
        MAX_REQUEST_INTERVAL: parseInt(process.env.RATE_LIMITER_MAX_REQUEST_INTERVAL ?? '60000', 10)
    },
    PDF_LIBRARY: process.env.PDF_LIBRARY || 'html-pdf',
    AWS: {
        S3_REGION: process.env.AWS_S3_REGION || null,
        PROFILE_NAME: process.env.AWS_PROFILE_NAME || null,
        S3_IMAGE_BUCKET: process.env.AWS_S3_IMAGE_BUCKET || null
    },
    RECAPTCHA_KEY: process.env.RECAPTCHA_KEY,
    REDIS: {
        HOST: process.env.REDIS_HOST,
        ENABLED: process.env.REDIS_ENABLED === 'true',
        PORT: parseInt(process.env.REDIS_PORT || '6379'),
        PASSWORD: process.env.REDIS_PASSWORD,
        REDIS_TIMEOUT_SECONDS: parseInt(process.env.REDIS_TIMEOUT_SECONDS || '3600') // 1 hour
    }
};
