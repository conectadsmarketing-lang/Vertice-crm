import axios from 'axios';
import { config } from '../config.js';

const api = axios.create({
  baseURL: config.evolution.apiUrl,
  headers: {
    'Content-Type': 'application/json',
    apikey: config.evolution.apiKey,
  },
  timeout: 10000,
});

const instance = config.evolution.instanceName;

export const WhatsAppService = {
  async createInstance(): Promise<void> {
    await api.post('/instance/create', {
      instanceName: instance,
      token: '',
      qrcode: true,
      integration: 'WHATSAPP-BAILEYS',
    });
  },

  async getQRCode(): Promise<string | null> {
    try {
      const res = await api.get(`/instance/connect/${instance}`);
      return res.data?.base64 ?? null;
    } catch {
      return null;
    }
  },

  async getConnectionState(): Promise<'open' | 'close' | 'connecting'> {
    try {
      const res = await api.get(`/instance/connectionState/${instance}`);
      return res.data?.instance?.state ?? 'close';
    } catch {
      return 'close';
    }
  },

  async sendText(to: string, text: string): Promise<boolean> {
    try {
      const phone = to.replace('@s.whatsapp.net', '').replace('@g.us', '');
      await api.post(`/message/sendText/${instance}`, {
        number: phone,
        text,
      });
      return true;
    } catch (err) {
      console.error('[WhatsApp] Send text error:', err);
      return false;
    }
  },

  async sendMedia(to: string, mediaUrl: string, caption?: string): Promise<boolean> {
    try {
      const phone = to.replace('@s.whatsapp.net', '').replace('@g.us', '');
      await api.post(`/message/sendMedia/${instance}`, {
        number: phone,
        mediatype: 'image',
        media: mediaUrl,
        caption,
      });
      return true;
    } catch {
      return false;
    }
  },

  async disconnect(): Promise<void> {
    await api.delete(`/instance/logout/${instance}`);
  },

  async registerWebhook(webhookUrl: string): Promise<void> {
    await api.post(`/webhook/set/${instance}`, {
      url: webhookUrl,
      webhook_by_events: false,
      webhook_base64: false,
      events: [
        'MESSAGES_UPSERT',
        'MESSAGES_UPDATE',
        'CONNECTION_UPDATE',
        'QRCODE_UPDATED',
      ],
    });
  },

  formatPhone(remoteJid: string): string {
    return remoteJid.replace('@s.whatsapp.net', '').replace('@g.us', '');
  },

  isGroup(remoteJid: string): boolean {
    return remoteJid.endsWith('@g.us');
  },
};
