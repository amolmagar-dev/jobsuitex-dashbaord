

// notification-service/notifiers/whatsapp/WhatsAppNotifier.js
import { Notifier } from '../Notifier.js';
import pkg from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Client, LocalAuth } = pkg;
const WHATSAPP_ENABLED = process.env.NOTIFY_WHATSAPP_ENABLED ?
  JSON.parse(process.env.NOTIFY_WHATSAPP_ENABLED) : false;

let client = null;
let isReady = false;
let qrCodeData = null;

// Create a directory for storing session data
const sessionDir = path.join(__dirname, 'session');
if (!fs.existsSync(sessionDir)) {
  fs.mkdirSync(sessionDir, { recursive: true });
}

if (WHATSAPP_ENABLED) {
  client = new Client({
    authStrategy: new LocalAuth({ dataPath: sessionDir }),
    puppeteer: {
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
  });

  client.on('qr', qr => {
    console.log('📱 Scan this QR code to authenticate:');
    qrcode.generate(qr, { small: true });

    // Store QR code for API retrieval
    qrCodeData = qr;
  });

  client.on('ready', () => {
    isReady = true;
    qrCodeData = null; // Clear QR code once authenticated
    console.log('✅ WhatsApp bot is ready!');
  });

  client.on('auth_failure', msg => {
    console.error('❌ WhatsApp auth failed:', msg);
    isReady = false;
  });

  client.on('disconnected', () => {
    console.log('📴 WhatsApp disconnected. Attempting to reconnect...');
    isReady = false;

    // Attempt to reconnect after a short delay
    setTimeout(() => {
      client.initialize();
    }, 5000);
  });

  // Initialize on startup
  client.initialize().catch(err => {
    console.error('Failed to initialize WhatsApp client:', err);
  });
} else {
  console.log('[WhatsAppNotifier] ⏩ Skipping WhatsApp client initialization: notifications are disabled');
}

export class WhatsAppNotifier extends Notifier {
  async notify(message, recipient) {
    if (!WHATSAPP_ENABLED) {
      console.log('[WhatsAppNotifier] ⚠️ Skipping WhatsApp notification: currently turned off by user');
      return;
    }

    if (!isReady) {
      throw new Error('WhatsApp client not ready');
    }

    if (!recipient) {
      throw new Error('WhatsApp recipient is required');
    }

    // Format the chat ID (add @c.us if not present)
    let chatId = recipient;
    if (!chatId.includes('@')) {
      chatId = `${chatId}@c.us`;
    }

    try {
      await client.sendMessage(chatId, message);
      console.log(`[WhatsAppNotifier] 📤 Message sent to ${chatId}`);
      return { success: true };
    } catch (err) {
      console.error(`[WhatsAppNotifier] ❌ Failed to send message: ${err.message}`);
      throw err;
    }
  }

  // Get the current QR code for authentication
  getQrCode() {
    return qrCodeData;
  }

  // Check connection status
  getStatus() {
    if (!WHATSAPP_ENABLED) {
      return { status: 'disabled', message: 'WhatsApp notifications are disabled' };
    }

    if (isReady) {
      return { status: 'ready', message: 'WhatsApp client is ready' };
    } else if (qrCodeData) {
      return { status: 'pending_auth', message: 'Requires QR code authentication', qrCode: qrCodeData };
    } else {
      return { status: 'initializing', message: 'WhatsApp client is initializing' };
    }
  }
}