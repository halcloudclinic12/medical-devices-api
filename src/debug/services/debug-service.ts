import fs from 'fs';
import ejs from 'ejs';
import path from 'path';

import AppUtils from 'utils/app-utils';
import appConfig from 'config/app-config';
import PdfService from 'shared/services/pdf-service';
import LoggerService from 'shared/services/logger-service';

export default class DebugService {
    private pdfService: PdfService;

    constructor() {
        this.pdfService = new PdfService();
    }

    async createPdf(data: any, headers: any) {
        let fileName = AppUtils.getUniqueId() + '-test.pdf';

        try {
            const publicDir = path.join(appConfig.ROOT, 'public');
            const imagePath = path.join(publicDir, 'images');
            const cssFilePath = path.join(publicDir, 'css', 'basic-test.css');
            const ejsFilePath = path.join(appConfig.ROOT, 'views/pdfs') + '/' + data.type + '.ejs';

            const birdImage = fs.readFileSync(imagePath + '/bird.jpg').toString('base64');

            let html: string = await ejs.renderFile(ejsFilePath,
                {
                    title: data.title,
                    birdImage: birdImage,
                    imagePath: imagePath
                });

            // Generate the PDF        
            let success = await this.pdfService.generatePdf({
                html: html,
                testType: data.type,
                fileName: fileName
            });

            return {
                success: success
            };
        } catch (error: any) {
            LoggerService.log('error', { error: error, message: 'Error in creating pdf:' + error ? JSON.stringify(error) : '-', 'location': 'patient-sev => store' });
            throw error;
        }
    }
}