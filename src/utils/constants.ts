export default {
    API: {
        V1: '/api/v1/',

        AUTH: 'auth',
        SYNC: 'sync',
        ROLE: 'roles',
        TEST: 'test/',
        USER: 'users',
        BASIC: 'basic',
        CITY: 'cities',
        DEBUG: 'debug',
        HBA1C: 'hba1c',
        LIPID: 'lipid',
        REDIS: 'redis',
        TESTS: 'tests',
        STATE: 'states',
        HEALTH: 'health',
        STATUS: 'status',
        CLINIC: 'clinics',
        SUMMARY: 'summary',
        PATIENT: 'patients',
        COUNTRY: 'countries',
        CUSTOMER: 'customers',
        PARAMETER: 'parameters',
        REPORT_URL: 'test/report',
        PARAMETER_RANGE: 'parameter-ranges'
    },

    DEFAULT_PAGED_RECORDS: 100,
    AWS_LINK_EXPIRY_MINUTES: 60 * 20, // URL expires in 20 minutes
    REDIS_TIMEOUT_SECONDS: 3600, // Redis cache expires in 30 minutes

    AGE_GROUPS: {                   // adding _ because first item in name should not be a number
        _1_TO_18: '1-18',
        _19_TO_40: '19-40',
        _41_TO_60: '41-60',
        _61_TO_120: '61-120'
    },

    DEFAULTS: {
        USER_IMAGE: 'default-user.jpg',
        PATIENT_IMAGE: 'default-patient.jpg'
    },

    GENDER: {
        MALE: 'male',
        FEMALE: 'female',
        NONE: 'none' // If not provided
    },

    EMAILS: {
        SERVICE_MAILGUN: 'Mailgun',
        SERVICE_SENDGRID: 'Sendgrid'
    },

    HTTP_STATUS: {
        OK: 200,
        CREATED: 201,
        ACCEPTED: 202,
        NO_CONTENT: 204,
        BAD_REQUEST: 400,
        UNAUTHORIZED: 401,
        FORBIDDEN: 403,
        NOT_FOUND: 404,
        METHOD_NOT_ALLOWED: 405,
        CONFLICT: 409,
        INTERNAL_SERVER_ERROR: 500,
        NOT_IMPLEMENTED: 501,
        BAD_GATEWAY: 502,
        SERVICE_UNAVAILABLE: 503,
        GATEWAY_TIMEOUT: 504,
    },

    MESSAGES: {
        APPLICATION_EXCEPTION: '',
        VERIFY_OTP: 'Please verify OTP',
        ALREADY_REMOVED: 'Already removed',
        ACCOUNT_VERIFIED: 'Account verified',
        NO_RECORD_UPDATED: 'No record updated',
        LOGIN_NOT_VERIFIED: 'Account not verified',
        ALREADY_VERIFIED: 'Account already verified',
        CANNOT_CHECK_USER_LOGIN: 'Error in checking login',
        FORGOT_PASSWORD_EMAIL_SENT: 'Forgot password email sent',
        ERRORS: {
            NOT_FOUND: 'Not found',
            INVALID_OTP: 'Invalid OTP',
            INVALID_LINK: 'Invalid link',
            DUPLICATE: 'Duplicate record',
            CREATE_FAILED: 'Cannot create',
            INVALID_LOGIN: 'Invalid login',
            INVALID_MOBILE: 'Invalid mobile',
            CITY_NOT_FOUND: 'City not found',
            CANNOT_SEND_SMS: 'Cannot send sms',
            EMAIL_NOT_FOUND: 'Email not found',
            INVALID_PATIENT: 'Invalid patient',
            STATE_NOT_FOUND: 'State not found',
            CANNOT_STORE_OTP: 'Cannot store OTP',
            COUNTRY_NOT_FOUND: 'Country not found',
            DATA_NOT_PROVIDED: 'Data not provided',
            EMAL_SENDING_FAILED: 'Cannot send email',
            INVALID_AUTH_TOKEN: 'Invalid auth token',
            CLINC_ID_ALREADY_USED: 'Clinic ID already used',
            PATIENT_LOGIN_FAILED: 'Cannot check patient login',
            CANNOT_CHECK_USER_LOGIN: 'Error in checking login',
            OLD_PASSWORD_MISMATCH: 'Old password did not match',
            SERVER_SECRET_MISSING: 'Server secret key is missing.',
            NO_EMAIL_PROVIDER_CONFIGURED: 'No email provider configured'
        }
    },

    ROLES: {
        USER: 'USER',
        PATIENT: 'PATIENT',
        ADMINISTRATOR: 'ADMINISTRATOR'
    },

    SUBJECTS: {
        FORGOT_PASSWORD: ''
    },

    TEMPLATES: {
        EXCEPTION: 'exception',
        FORGOT_PASSWORD: 'forgot-password'
    },

    TESTS: {
        BASIC: 'BASIC',
        HBA1C: 'HBA1C',
        LIPID: 'LIPID'
    },

    USER_TYPES: {
        USER: 'USER',
        CUSTOMER: 'CUSTOMER',
        ADMINISTRATOR: 'ADMINISTRATOR',
    },
}