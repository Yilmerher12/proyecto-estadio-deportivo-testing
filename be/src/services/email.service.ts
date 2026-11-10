import nodemailer from 'nodemailer';
import { getTransporter } from '../config/email';
import { env } from '../config/env';
import {
  welcomeEmailTemplate,
  resetPasswordEmailTemplate,
  concessionCreatedEmailTemplate,
} from '../utils/email-templates';

async function send(to: string, subject: string, html: string): Promise<void> {
  const transporter = await getTransporter();
  const info = await transporter.sendMail({ from: env.EMAIL_FROM, to, subject, html });

  if (env.NODE_ENV !== 'production') {
    console.log(`📧 [${subject}] vista previa:`, nodemailer.getTestMessageUrl(info));
  }
}

export function sendWelcomeEmail(to: string, name: string): Promise<void> {
  return send(to, '¡Bienvenido al Estadio Deportivo!', welcomeEmailTemplate(name));
}

export function sendResetPasswordEmail(to: string, name: string, resetUrl: string): Promise<void> {
  return send(to, 'Recuperar contraseña — Estadio Deportivo', resetPasswordEmailTemplate(name, resetUrl));
}

export function sendConcessionCreatedEmail(
  to: string,
  name: string,
  concessionName: string,
  category: string,
): Promise<void> {
  return send(
    to,
    'Concesión agregada al catálogo',
    concessionCreatedEmailTemplate(name, concessionName, category),
  );
}
