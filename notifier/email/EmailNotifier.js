import { Notifier } from '../Notifier.js';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

let transporter = null;
const EMAIL_ENABLED = process.env.NOTIFY_EMAIL_ENABLED ?
  JSON.parse(process.env.NOTIFY_EMAIL_ENABLED) : false;

if (EMAIL_ENABLED) {
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
} else {
  console.log('[EmailNotifier] ⏩ Skipping email client initialization: notifications are disabled');
}

export class EmailNotifier extends Notifier {
  async notify(message, recipient) {
    if (!EMAIL_ENABLED) {
      console.log('[EmailNotifier] ⚠️ Skipping email notification: currently turned off by user');
      return;
    }

    if (!recipient) {
      throw new Error('Email recipient is required');
    }

    const from = process.env.EMAIL_FROM;
    const subject = process.env.NOTIFY_EMAIL_SUBJECT || 'Notification';

    // Handle HTML messages
    let text = message;
    let html = `<p>${message}</p>`;

    // If message appears to be HTML, set accordingly
    if (message.includes('<html>') || message.includes('<body>') || message.includes('<div>')) {
      html = message;
      // Create a plain text version by stripping HTML tags
      text = message.replace(/<[^>]*>?/gm, '');
    }

    const info = await transporter.sendMail({
      from,
      to: recipient,
      subject,
      text,
      html
    });

    console.log(`[EmailNotifier] 📧 Email sent to ${recipient}: ${info.messageId}`);
    return info;
  }

  // Check connection status
  async checkConnection() {
    if (!EMAIL_ENABLED) {
      return { status: 'disabled', message: 'Email notifications are disabled' };
    }

    try {
      await transporter.verify();
      return { status: 'connected', message: 'Email service is connected' };
    } catch (error) {
      return { status: 'error', message: error.message };
    }
  }
}