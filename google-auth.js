import { google } from 'googleapis';
import fs from 'fs-extra';

export function getDriveClient() {
    const credentials = JSON.parse(
        fs.readFileSync('credentials.json', 'utf-8'),
    );

    const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: [
            'https://www.googleapis.com/auth/drive',
            'https://www.googleapis.com/auth/drive.file',
            'https://www.googleapis.com/auth/drive.appdata',
        ],
    });

    return google.drive({
        version: 'v3',
        auth,
    });
}
