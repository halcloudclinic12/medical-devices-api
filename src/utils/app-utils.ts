import { v4 as uuidv4 } from 'uuid';

export default class AppUtils {
    static getUniqueId() {
        return uuidv4();
    }

    static getUniqueFilename(): string {
        const timestamp = Date.now(); // Current timestamp
        return `${timestamp}`;
    }

    static generateOTP() {
        return Math.floor(1000 + Math.random() * 9000).toString();
    }

    static getMimeType(filename: string) {
        const extensionToMimeType: any = {
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'gif': 'image/gif',
            'webp': 'image/webp',
            'svg': 'image/svg+xml',
            'pdf': 'application/pdf',
            'txt': 'text/plain',
            'html': 'text/html',
            'css': 'text/css',
            'js': 'application/javascript',
            'json': 'application/json',
            'xml': 'application/xml'
        };

        const ext: string | undefined = this.getFileExtension(filename);
        return ext ? extensionToMimeType[ext] : 'application/octet-stream'; // Default MIME type if not found
    }

    static getFileExtension(filename: string): string | undefined {
        const ext = filename.split('.').pop();
        return ext?.toLowerCase();
    }

    static getPatientName(patient: any): string {
        let name = '';
        if (patient) {
            if (patient.first_name) {
                name += patient.first_name;
            }
            if (patient.last_name) {
                if (name) name += ' ';
                name += patient.last_name;
            }
            if (!name && patient.name) {
                name = patient.name;
            }
        }
        return name || 'N/A';
    }
}