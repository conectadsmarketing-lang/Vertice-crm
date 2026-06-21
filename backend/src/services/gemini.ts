import { GoogleGenAI } from '@google/genai';
import { config } from '../config.js';

const ai = new GoogleGenAI({ apiKey: config.geminiApiKey });

export const GeminiService = {
  async generateReply(
    systemPrompt: string,
    history: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }>,
    userMessage: string,
    knowledgeBase?: string,
  ): Promise<string> {
    try {
      const fullSystemPrompt = knowledgeBase
        ? `${systemPrompt}\n\n--- BASE DE CONHECIMENTO ---\n${knowledgeBase}`
        : systemPrompt;

      const contents = [
        ...history,
        { role: 'user' as const, parts: [{ text: userMessage }] },
      ];

      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents,
        config: {
          systemInstruction: fullSystemPrompt,
          maxOutputTokens: 512,
          temperature: 0.7,
        },
      });

      return response.text?.trim() || 'Desculpe, não consegui processar sua mensagem. Tente novamente.';
    } catch (error) {
      console.error('[Gemini] Error generating reply:', error);
      return 'Desculpe, houve um problema técnico. Um de nossos corretores entrará em contato em breve.';
    }
  },

  async extractLeadData(conversationText: string): Promise<{
    name?: string;
    interest?: string;
    budget?: string;
    timeline?: string;
    bedroomsDesired?: number;
    neighborhoodDesired?: string;
  }> {
    try {
      const prompt = `Analise a conversa abaixo e extraia informações do lead em JSON. Retorne APENAS o JSON, sem markdown.

Conversa:
${conversationText}

Extraia (use null se não encontrado):
{
  "name": "nome do cliente",
  "interest": "compra|aluguel|não identificado",
  "budget": "valor mencionado como string",
  "timeline": "prazo mencionado",
  "bedroomsDesired": número de quartos ou null,
  "neighborhoodDesired": "bairro/cidade mencionada"
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: { temperature: 0.1, maxOutputTokens: 256 },
      });

      const text = response.text?.trim() || '{}';
      const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(cleaned);
    } catch {
      return {};
    }
  },
};
