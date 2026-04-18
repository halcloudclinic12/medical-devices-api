import ejs from 'ejs';
import * as path from 'path';
import fs, { readFileSync } from 'fs';

export default class FileService {
    public async getTemplate(data: any, templateName: string): Promise<string> {
        let rootPath = path.normalize(__dirname + '/..');
        let templatePath = rootPath + '/views/templates/' + templateName + '.ejs';

        try {
            return await ejs.renderFile(templatePath, data);
        } catch (error) {
            throw error;
        }
    }

    public readFile(filePath: any, format: any = 'utf-8') {
        if (this.checkIfFileExists(filePath)) {
            return readFileSync(filePath, format);
        } else {
            return null;
        }
    }

    public checkIfFileExists(filePath: string) {
        return fs.existsSync(filePath);
    }
}