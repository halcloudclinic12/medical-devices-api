import crypto from 'crypto';
import * as bcrypt from 'bcryptjs';
import appConfig from 'config/app-config';

export default class EncryptionService {
    static readonly key: string = appConfig.SERVER_KEYS.SERVER_SECRET;
    static readonly algorithm: string = appConfig.ENCRYPTION_ALGORITHM;

    /***************** methods for bcrypt library ******************************/

    static encryptWithBcrypt(text: string) {
        var salt = bcrypt.genSaltSync(10);

        // Salt and hash password
        var hash = bcrypt.hashSync(text, salt);

        return hash;
    }

    static verifyWithBcrypt(text: string, hash: any) {
        return bcrypt.compareSync(text, hash);
    }

    /***************** methods for crypto library ******************************/

    static encryptWithCrypto(text: any) {
        let iv = crypto.randomBytes(16).toString("hex").slice(0, 16);
        let cipher = crypto.createCipheriv(EncryptionService.algorithm, EncryptionService.key, iv);
        let encryptedText = cipher.update(text, "utf8", "hex");
        encryptedText += cipher.final("hex");
        encryptedText = iv + encryptedText;

        return encryptedText;
    }

    static decryptWithCrypto(text: any) {
        try {
            const iv = text.slice(0, 16);
            text = text.slice(16, text.length);
            let decipher = crypto.createDecipheriv(EncryptionService.algorithm, EncryptionService.key, iv);
            let decryptedText = decipher.update(text, "hex", "utf8");
            decryptedText += decipher.final("utf8");

            return decryptedText;
        } catch (error) {
            return null;
        }
    }

    /**
     * Generate a unique token
     * @returns {string} - A securely generated random token
     */
    static generateForgotPasswordToken() {
        return crypto.randomBytes(32).toString('hex');
    }

    static getFingerPrintHash(fingerPrint: any) {
        return crypto.createHash('sha256').update(fingerPrint).digest('hex');
    }
}