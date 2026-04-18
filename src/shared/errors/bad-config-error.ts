export default class BadConfigError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'BadConfigError';
        Error.captureStackTrace(this, BadConfigError); // Capture the stack trace for debugging
    }
}