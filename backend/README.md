# VÉRTICE – WhatsApp AI Agent Backend

Backend Node.js/Express para o módulo de Agente de IA via WhatsApp do VÉRTICE CRM.

## Arquitetura

```
Cliente WhatsApp → Evolution API → Webhook → Express Server → Gemini AI → Resposta
                                                    ↓
                                              WebSocket → Frontend React
```

## Pré-requisitos

- Node.js ≥ 18
- [Evolution API](https://github.com/EvolutionAPI/evolution-api) rodando (Docker ou cloud)
- Chave de API do [Google AI Studio](https://aistudio.google.com/app/apikey)

## Setup rápido

```bash
# 1. Instalar dependências
cd backend
npm install

# 2. Configurar ambiente
cp .env.example .env
# Edite .env com suas chaves

# 3. Iniciar em desenvolvimento
npm run dev

# 4. Build para produção
npm run build && npm start
```

## Evolution API com Docker

```bash
docker run -d \
  --name evolution-api \
  -p 8080:8080 \
  -e AUTHENTICATION_API_KEY=sua_chave_aqui \
  atendai/evolution-api:latest
```

## Variáveis de ambiente

| Variável | Descrição |
|---|---|
| `PORT` | Porta do servidor (padrão: 3001) |
| `GEMINI_API_KEY` | Chave da API do Gemini (Google AI) |
| `EVOLUTION_API_URL` | URL da Evolution API |
| `EVOLUTION_API_KEY` | Chave de autenticação da Evolution API |
| `EVOLUTION_INSTANCE_NAME` | Nome da instância WhatsApp |
| `WEBHOOK_BASE_URL` | URL pública deste servidor (para Evolution API) |
| `FRONTEND_URL` | URL do frontend (CORS) |

## Endpoints da API

### Webhook
```
POST /webhook              - Recebe eventos do WhatsApp (Evolution API)
```

### Conversas
```
GET  /api/conversations           - Listar conversas
GET  /api/conversations/:id       - Detalhes + mensagens
POST /api/conversations/:id/send  - Enviar mensagem como humano
PATCH /api/conversations/:id/status - Alterar status (bot/human/closed)
POST /api/conversations/:id/read  - Marcar como lido
DELETE /api/conversations/:id     - Arquivar conversa
```

### Agente
```
GET  /api/agent/config   - Buscar configuração do bot
PUT  /api/agent/config   - Salvar configuração
POST /api/agent/test     - Testar resposta da IA
GET  /api/agent/analytics - Analytics do agente
```

### Instância
```
GET  /api/instance/status    - Status da conexão WhatsApp
POST /api/instance/connect   - Iniciar conexão (gera QR code)
POST /api/instance/disconnect - Desconectar
```

## WebSocket

Conecte em `ws://localhost:3001/ws`

### Eventos recebidos
| Evento | Payload |
|---|---|
| `new_message` | `{ conversationId, message, conversation }` |
| `message_sent` | `{ conversationId, message }` |
| `conversation_updated` | `WAConversation` |
| `instance_status` | `WAInstance` |
| `qr_code` | `{ qrCode: string }` |
| `analytics_update` | `WAAnalytics` |

## Expondo o webhook publicamente (desenvolvimento)

Use [ngrok](https://ngrok.com) ou [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/):

```bash
# ngrok
ngrok http 3001

# Atualize WEBHOOK_BASE_URL no .env com a URL gerada
```
