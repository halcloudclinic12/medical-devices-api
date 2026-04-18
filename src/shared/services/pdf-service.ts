import fs from 'fs';
import ejs from 'ejs';
import path from 'path';
import puppeteer from "puppeteer";
import config from 'config/app-config';
import appConfig from 'config/app-config';
import LoggerService from './logger-service';

const pdfDir = path.resolve(path.join(config.ROOT, '../../pdfs'));

export default class PdfService {
    async getPdfContent(data: any) {
        const rootDir = path.resolve(appConfig.ROOT);
        const publicDir = path.join(rootDir, 'public');
        const imagePath = path.join(publicDir, 'images');
        const ejsFilePath = path.join(rootDir, 'views', 'pdfs', data.testType.toLowerCase() + '.ejs');
        const jsonPath = path.join(publicDir, 'data', 'ranges', data.testType.toLowerCase() + '.json');

        // Verify files exist
        if (!fs.existsSync(ejsFilePath)) {
            throw new Error(`EJS template not found: ${ejsFilePath}`);
        }
        if (!fs.existsSync(jsonPath)) {
            throw new Error(`Ranges JSON not found: ${jsonPath}`);
        }
        const logoPath = path.join(imagePath, 'logo.jpg');
        if (!fs.existsSync(logoPath)) {
            throw new Error(`Logo not found: ${logoPath}`);
        }

        // Read and parse the ranges JSON file
        const ranges = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
        const logo = fs.readFileSync(logoPath, { encoding: 'base64' });

        try {
            return await ejs.renderFile(ejsFilePath, {
                logo: logo,
                ranges: ranges,
                test: data.test,
                title: data.title,
                clinic: data.clinic,
                city: data.city,
                imagePath: imagePath,
                patient: data.patient,
            });
        } catch (error: any) {
            LoggerService.log('error', {
                error,
                message: 'EJS renderFile failed',
                ejsFilePath
            });
            throw new Error(`Failed to render EJS template at ${ejsFilePath}: ${error.message}`);
        }
    }

    async generatePdf(data: { html: string, testType: string, fileName?: string }) {
        // Define the file path to save the PDF
        const pdfFileName = data.fileName ? data.fileName : data.testType.toLowerCase() + '-' + Date.now() + '.pdf';
        const pdfFilePath = path.join(pdfDir, pdfFileName);

        const rootDir = path.resolve(appConfig.ROOT);
        const publicDir = path.join(rootDir, 'public');
        console.log('Generating PDF with CSS for test type:', data.testType);
        const cssFilePath = path.join(publicDir, 'css', data.testType.toLowerCase() + '.css');

        LoggerService.log('info', { message: 'PDF file path:' + pdfFilePath, testType: data.testType, location: 'pdf-service => generatePdf', data: 'PDF file path:' + pdfFilePath });

        // Ensure the 'pdfs' directory exists
        if (!fs.existsSync(pdfDir)) {
            fs.mkdirSync(pdfDir, { recursive: true });
        }

        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();

        await page.setContent(data.html);
        await page.addStyleTag({ path: cssFilePath });

        await page.pdf({
            format: 'A4',
            path: pdfFilePath,
            printBackground: true, // Ensure CSS background colors are rendered
        });

        await browser.close();

        // Read PDF into Buffer (ensure binary mode)
        const pdfBuffer = fs.readFileSync(pdfFilePath);

        // Return both Buffer and File Path
        return { pdfBuffer, pdfFilePath };
    }
}