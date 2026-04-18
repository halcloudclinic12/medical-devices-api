export default class BadRequestError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'BadRequestError';
        Error.captureStackTrace(this, BadRequestError); // Capture the stack trace for debugging
    }
}