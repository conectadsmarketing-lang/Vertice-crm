import { Router } from 'express';
import { AgentService } from '../services/agent.js';
import { StorageService } from '../services/storage.js';
import { broadcast } from '../websocket/index.js';
import type { EvolutionWebhookPayload } from '../types/index.js';

const router = Router();

router.post('/', async (req, res) => {
  const payload = req.body as EvolutionWebhookPayload;

  res.status(200).json({ ok: true });

  try {
    if (payload.event === 'MESSAGES_UPSERT') {
      await AgentService.processIncoming(payload);
    }

    if (payload.event === 'CONNECTION_UPDATE') {
      const state = payload.data?.status;
      const instance = StorageService.getInstance();

      if (state === 'open') {
        instance.status = 'connected';
        instance.connectedAt = Date.now();
        instance.qrCode = undefined;
      } else if (state === 'close') {
        instance.status = 'disconnected';
      } else if (state === 'connecting') {
        instance.status = 'connecting';
      }

      StorageService.saveInstance(instance);
      broadcast({ type: 'instance_status', payload: instance });
    }

    if (payload.event === 'QRCODE_UPDATED') {
      const instance = StorageService.getInstance();
      instance.status = 'connecting';
      instance.qrCode = payload.data?.key?.id ?? undefined;
      StorageService.saveInstance(instance);
      broadcast({ type: 'qr_code', payload: { qrCode: instance.qrCode } });
    }
  } catch (err) {
    console.error('[Webhook] Processing error:', err);
  }
});

export default router;
