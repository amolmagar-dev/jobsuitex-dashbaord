// notifier/WhatsAppNotifier.js
import { Notifier } from '../Notifier.js';
import pkg from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';
import dotenv from 'dotenv';

dotenv.config();

const { Client, LocalAuth } = pkg;
const WHATSAPP_ENABLED = JSON.parse(process.env.NOTIFY_WHATSAPP_ENABLED);

let client = null;
let isReady = false;

if (WHATSAPP_ENABLED) {
  client = new Client({ authStrategy: new LocalAuth() });

  client.on('qr', qr => {
    console.log('📱 Scan this QR code to authenticate:');
    qrcode.generate(qr, { small: true });
  });

  client.on('ready', () => {
    isReady = true;
    console.log('✅ WhatsApp bot is ready!');
  });

  client.on('auth_failure', msg => {
    console.error('❌ WhatsApp auth failed:', msg);
  });

  client.initialize();
} else {
  console.log('[WhatsAppNotifier] ⏩ Skipping WhatsApp client initialization: notifications are disabled');
}

export class WhatsAppNotifier extends Notifier {
  async notify(message) {
    if (!WHATSAPP_ENABLED) {
      console.log('[WhatsAppNotifier] ⚠️ Skipping WhatsApp notification: currently turned off by user');
      return;
    }

    if (!isReady) {
      console.warn('[WhatsAppNotifier] ⚠️ WhatsApp client not ready');
      return;
    }

    const chatId = `${process.env.NOTIFY_WHATSAPP_TO}@c.us`;

    try {
      await client.sendMessage(chatId, message);
      console.log(`[WhatsAppNotifier] 📤 Message sent to ${chatId}`);
    } catch (err) {
      console.error(`[WhatsAppNotifier] ❌ Failed to send message: ${err.message}`);
      throw err;
    }
  }
}
