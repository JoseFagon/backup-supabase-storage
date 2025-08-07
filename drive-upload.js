import { getDriveClient } from './google-auth.js';
import dotenv from 'dotenv';

dotenv.config();

export async function uploadToDrive(filename, fileStream) {
    const drive = getDriveClient();

    try {
        const fileMetadata = {
            name: filename,
            parents: [process.env.GOOGLE_DRIVE_FOLDER_ID],
        };

        const media = {
            mimeType: 'application/zip',
            body: fileStream,
        };

        const response = await drive.files.create({
            resource: fileMetadata,
            media,
            fields: 'id, webViewLink',
        });

        const { webViewLink } = response.data;
        console.log(`✅ Arquivo enviado com sucesso: ${webViewLink}`);
        return webViewLink;
    } catch (error) {
        console.error('❌ Falha no upload para o Drive:', {
            message: error.message,
            code: error.code,
            errors: error.errors,
        });
        throw error;
    }
}
