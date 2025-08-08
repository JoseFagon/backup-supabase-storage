import fs from 'fs';
import path from 'path';
import os from 'os';

export async function uploadToOneDrive(fileName, buffer) {
    const userProfile = os.homedir();
    
    let oneDrivePath;
    
    oneDrivePath = path.join(userProfile, 'OneDrive');
    
    if (!fs.existsSync(oneDrivePath)) {
        oneDrivePath = path.join(userProfile, 'OneDrive - Fagon');
    }
    
    if (!fs.existsSync(oneDrivePath)) {
        oneDrivePath = path.join(userProfile, 'Documents', 'OneDrive');
    }

    if (!fs.existsSync(oneDrivePath)) {
        throw new Error(`Pasta do OneDrive não encontrada. Verificamos em:
            - ${path.join(userProfile, 'OneDrive')}
            - ${path.join(userProfile, 'OneDrive - Fagon')}
            - ${path.join(userProfile, 'Documents', 'OneDrive')}
            Verifique se o OneDrive está instalado e sincronizando.`
        );
    }

    const backupsFolder = path.join(oneDrivePath, 'Backups');
    
    if (!fs.existsSync(backupsFolder)) {
        fs.mkdirSync(backupsFolder);
        console.log(`📂 Pasta "Backups" criada em: ${backupsFolder}`);
    }

    const destinationPath = path.join(backupsFolder, fileName);

    try {
        fs.writeFileSync(destinationPath, buffer);
        console.log('✅ Backup salvo no OneDrive:', destinationPath);
        return destinationPath;
    } catch (error) {
        console.error('❌ Erro ao salvar backup:', error.message);
        throw error;
    }
}