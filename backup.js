import { createClient } from '@supabase/supabase-js';
import { PassThrough } from 'stream';
import AdmZip from 'adm-zip';
import dotenv from 'dotenv';
import * as path from 'path';
import { uploadToDrive } from './drive-upload.js';
import { sendEmail } from './email.js';

dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const BUCKET = process.env.BUCKET_NAME;

async function listAllFiles(prefix = '') {
    const files = [];
    const { data, error } = await supabase.storage
        .from(BUCKET)
        .list(prefix, { limit: 1000 });

    if (error) {
        console.error('Erro ao listar arquivos:', error.message);
        return [];
    }

    for (const item of data) {
        const fullPath = path.posix.join(prefix, item.name);
        if (item.metadata?.size !== undefined) {
            files.push(fullPath);
        } else {
            const sub = await listAllFiles(fullPath);
            files.push(...sub);
        }
    }

    return files;
}

async function createZipStream(files) {
    const zip = new AdmZip();
    const passThrough = new PassThrough();

    for (const filePath of files) {
        const { data } = await supabase.storage.from(BUCKET).download(filePath);

        if (data) {
            const buffer = Buffer.from(await data.arrayBuffer());
            zip.addFile(filePath, buffer);
            console.log(`✔️ Adicionado ao ZIP: ${filePath}`);
        }
    }

    zip.toBuffer((buffer) => {
        passThrough.write(buffer);
        passThrough.end();
    });

    return passThrough;
}

async function runBackup() {
    console.log(`📥 Iniciando backup do bucket '${BUCKET}'...`);
    const files = await listAllFiles();

    const zipStream = await createZipStream(files);

    const driveLink = await uploadToDrive(
        `backup-${new Date().toISOString().slice(0, 10)}.zip`,
        zipStream,
    );

    await sendEmail(driveLink);
    console.log('✅ Backup enviado diretamente para o Drive.');
}

runBackup();
