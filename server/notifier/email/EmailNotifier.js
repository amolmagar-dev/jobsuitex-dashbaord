// notifier/EmailNotifier.js
import { Notifier } from '../Notifier.js';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

let transporter = null;
const EMAIL_ENABLED = JSON.parse(process.env.NOTIFY_EMAIL_ENABLED);

if (EMAIL_ENABLED) {
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
} else {
  console.log('[EmailNotifier] ⏩ Skipping email client initialization: notifications are disabled');
}

export class EmailNotifier extends Notifier {
  async notify(message) {
    if (!EMAIL_ENABLED) {
      console.log('[EmailNotifier] ⚠️ Skipping email notification: currently turned off by user');
      return;
    }

    const to = process.env.NOTIFY_EMAIL_TO;
    const subject = process.env.NOTIFY_EMAIL_SUBJECT || 'Notification';

    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      text: message,
      html: `<p>${message}</p>`
    });

    console.log(`[EmailNotifier] 📧 Email sent to ${to}: ${info.messageId}`);
    return info;
  }
}
