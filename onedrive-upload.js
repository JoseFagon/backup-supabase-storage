import { Client } from '@microsoft/microsoft-graph-client';
import 'isomorphic-fetch';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

async function getAccessToken() {
    const response = await fetch(`https://login.microsoftonline.com/${process.env.MS_TENANT_ID}/oauth2/v2.0/token`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            client_id: process.env.MS_CLIENT_ID,
            scope: 'https://graph.microsoft.com/.default',
            client_secret: process.env.MS_CLIENT_SECRET,
            grant_type: 'client_credentials',
        }),
    });

    const data = await response.json();
    if (data.error) throw new Error(`Erro ao obter token: ${data.error_description}`);
    return data.access_token;
}

export async function uploadToOneDrive(filename, fileStream) {
    const accessToken = await getAccessToken();

    const client = Client.init({
        authProvider: (done) => {
            done(null, accessToken);
        },
    });

    try {
        const uploadResponse = await client
            .api(`/me/drive/root:/${filename}:/content`)
            .putStream(fileStream);

        console.log('✅ Upload concluído:', uploadResponse.webUrl);
        return uploadResponse.webUrl;
    } catch (error) {
        console.error('❌ Erro ao enviar para o OneDrive:', error);
        throw error;
    }
}
