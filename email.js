import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

export async function sendEmail(driveLink) {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    const info = await transporter.sendMail({
        from: `"Backup Supabase" <${process.env.EMAIL_USER}>`,
        to: process.env.EMAIL_TO,
        subject: '📦 Backup diário do Supabase Storage',
        html: `<p>O backup foi realizado com sucesso e enviado para o Google Drive.</p>
           <p><a href="${driveLink}" target="_blank">Clique aqui para acessar o backup (.zip)</a></p>`,
    });

    console.log('📧 E-mail enviado:', info.messageId);
}
