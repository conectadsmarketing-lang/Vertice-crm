import { Router } from 'express';
import { StorageService } from '../services/storage.js';
import { WhatsAppService } from '../services/whatsapp.js';
import { broadcast } from '../websocket/index.js';
import { config } from '../config.js';

const router = Router();

router.get('/status', async (_req, res) => {
  const instance = StorageService.getInstance();

  try {
    const state = await WhatsAppService.getConnectionState();
    if (state === 'open') instance.status = 'connected';
    else if (state === 'connecting') instance.status = 'connecting';
    else instance.status = 'disconnected';
    StorageService.saveInstance(instance);
  } catch {
    // Evolution API not reachable - return stored status
  }

  res.json(instance);
});

router.post('/connect', async (_req, res) => {
  try {
    const instance = StorageService.getInstance();
    instance.status = 'connecting';
    instance.qrCode = undefined;
    StorageService.saveInstance(instance);

    // Try to create instance (ignore if already exists)
    try {
      await WhatsAppService.createInstance();
    } catch {}

    // Register webhook
    const webhookUrl = `${config.webhookBaseUrl}/webhook`;
    try {
      await WhatsAppService.registerWebhook(webhookUrl);
    } catch {}

    // Get QR code
    const qr = await WhatsAppService.getQRCode();

    if (qr) {
      instance.qrCode = qr;
      StorageService.saveInstance(instance);
      broadcast({ type: 'qr_code', payload: { qrCode: qr } });
      res.json({ ok: true, qrCode: qr, message: 'Escaneie o QR code com seu WhatsApp' });
    } else {
      res.json({ ok: true, message: 'Conectando... aguarde o QR code via WebSocket' });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[Instance] Connect error:', message);
    res.status(500).json({ error: 'Erro ao conectar. Verifique as configurações da Evolution API.', detail: message });
  }
});

router.post('/disconnect', async (_req, res) => {
  try {
    await WhatsAppService.disconnect();
  } catch {}

  const instance = StorageService.getInstance();
  instance.status = 'disconnected';
  instance.qrCode = undefined;
  instance.phone = undefined;
  instance.connectedAt = undefined;
  StorageService.saveInstance(instance);
  broadcast({ type: 'instance_status', payload: instance });

  res.json({ ok: true });
});

export default router;
