import { Readable } from "stream";
import { writeFileSync } from "fs";
import { Upload } from "@aws-sdk/lib-storage";
import { fromIni } from "@aws-sdk/credential-provider-ini";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

import config from 'config/app-config';
import constants from 'utils/constants';
import LoggerService from "./logger-service";

const credentials = fromIni({ profile: config.AWS.PROFILE_NAME });

// Configure the AWS region
const s3Client = new S3Client({
    credentials: credentials,
    region: config.AWS.S3_REGION || 'us-east-1'
});

export default class AwsService {
    // Method to upload a file to S3
    async uploadFile(fileKey: string, fileContent: any, bucketName: string, mimeType: string) {
        if (process.env.NODE_ENV === 'test') {
            return {
                success: true
            };
        }

        const params: any = {
            Bucket: bucketName,
            Key: fileKey,
            Body: fileContent,
            ContentType: mimeType
        };

        try {
            const data = await new Upload({
                params: params,
                client: s3Client
            }).done();

            LoggerService.log('info', { message: `File uploaded successfully at ${data.Location}` });
            return data;
        } catch (error) {
            LoggerService.log('info', { message: `Error in uploading file` });
            throw error;
        }
    }

    // Method to download a file from S3
    async downloadFile(fileKey: string, downloadPath: string, bucketName: string): Promise<void> {
        const params: any = {
            Key: fileKey,
            Bucket: bucketName
        };

        try {
            const { Body } = await s3Client.send(new GetObjectCommand(params));
            const bodyStream = Body as Readable;

            const bodyContents = await new Promise<Buffer>((resolve, reject) => {
                const chunks: Buffer[] = [];
                bodyStream.on("data", (chunk) => chunks.push(chunk as Buffer));
                bodyStream.on("end", () => resolve(Buffer.concat(chunks)));
                bodyStream.on("error", reject);
            });

            writeFileSync(downloadPath, bodyContents);
            LoggerService.log('info', { message: `File uploaded successfully at ${downloadPath}` });
        } catch (error: any) {
            LoggerService.log('info', { message: `Error in downloading file` });
            throw error;
        }
    }

    async getImage(data: any, headers: any) {
        // Create a command to get the object
        const params: any = {
            Bucket: data.bucketName,
            Key: `${data.folder}/${data.file}`,
        };

        const command = new GetObjectCommand(params);

        try {
            // Generate the signed URL for the getObject operation
            const signedUrl = await getSignedUrl(s3Client, command, {
                expiresIn: constants.AWS_LINK_EXPIRY_MINUTES * 60, // ExpiresIn is in seconds
            });

            return signedUrl;
        } catch (error) {
            LoggerService.log('info', { message: `Error in getting signed image URL` });
            return null;
        }
    }
}