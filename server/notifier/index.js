import { EmailNotifier } from './email/EmailNotifier.js';
import { WhatsAppNotifier } from './whatsapp/WhatsAppNotifier.js';

const emailNotifier = new EmailNotifier();
const whatsappNotifier = new WhatsAppNotifier();

export async function notifyAll(message) {
  await Promise.allSettled([
    emailNotifier.notify(message),
    whatsappNotifier.notify(message)
  ]);
}
