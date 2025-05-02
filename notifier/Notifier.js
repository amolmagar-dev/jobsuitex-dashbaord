export class Notifier {
  async notify(message) {
    throw new Error('notify() must be implemented by subclass');
  }
}
