import { createClient } from '@supabase/supabase-js';
import { PassThrough } from 'stream';
import AdmZip from 'adm-zip';
import dotenv from 'dotenv';
import * as path from 'path';
import { sendEmail } from './email.js';
import { uploadToOneDrive } from './onedrive-upload.js';
import * as fs from 'fs';

dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const BUCKET = process.env.BUCKET_NAME;
const RETENTION_DAYS = 30;

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
        } else if (item.name !== '.emptyFolderPlaceholder') {
            const sub = await listAllFiles(fullPath);
            files.push(...sub);
        }
    }

    return files;
}

async function createZipBuffer(files) {
    const zip = new AdmZip();

    for (const filePath of files) {
        const { data } = await supabase.storage.from(BUCKET).download(filePath);
        if (data) {
            const buffer = Buffer.from(await data.arrayBuffer());
            zip.addFile(filePath, buffer);
            console.log(`✔️ Adicionado ao ZIP: ${filePath}`);
        }
    }

    return zip.toBuffer();
}

async function cleanOldFiles() {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - RETENTION_DAYS);

    const allFiles = await listAllFiles();

    const filesToDelete = allFiles.filter((filePath) => {
        const timestamp = parseInt(filePath.split('/').pop().split('-')[0]);
        if (isNaN(timestamp)) return false;

        const fileDate = new Date(timestamp);
        return fileDate < cutoffDate;
    });

    if (filesToDelete.length > 0) {
        const { error } = await supabase.storage
            .from(BUCKET)
            .remove(filesToDelete);

        if (error) {
            console.error('Erro ao limpar arquivos:', error.message);
        } else {
            console.log(
                `♻️ Limpeza mensal: ${filesToDelete.length} arquivos antigos removidos`,
            );
        }
    } else {
        console.log('✅ Nenhum arquivo antigo para limpar');
    }
}

async function runBackup() {
    try {
        console.log(`📥 Iniciando backup do bucket '${BUCKET}'...`);
        const files = await listAllFiles();

        if (files.length === 0) {
            console.log('⚠️ Nenhum arquivo encontrado para backup');
            return;
        }

        const zipBuffer = await createZipBuffer(files);
        const backupName = `backup-${new Date().toISOString().slice(0, 10)}.zip`;
        
        const drivePath = await uploadToOneDrive(backupName, zipBuffer);

        if (new Date().getDate() === 1) {
            await cleanOldFiles();
        }

        await sendEmail(drivePath);
        console.log('✅ Backup concluído com sucesso!');
    } catch (error) {
        console.error('❌ Erro no processo de backup:', error.message);
    }
}

runBackup();
