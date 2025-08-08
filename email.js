import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

export async function sendEmail(driveLink) {
    const transporter = nodemailer.createTransport({
        host: "smtp.office365.com",
        port: 587,
        secure: false,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
        tls: {
            ciphers: 'SSLv3'
        }
    });

    try {
        const info = await transporter.sendMail({
            from: `"Backup Supabase" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_TO,
            subject: '📦 Backup diário do Supabase Storage',
            html: `<p>O backup foi realizado com sucesso e enviado para o OneDrive.</p>
               <p><a href="${driveLink}" target="_blank">Clique aqui para acessar o backup (.zip)</a></p>`,
        });

        console.log('📧 E-mail enviado via Outlook:', info.messageId);
    } catch (error) {
        console.error('❌ Falha ao enviar e-mail:', error);
        throw error;
    }
}