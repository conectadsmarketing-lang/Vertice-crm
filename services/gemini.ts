
import { GoogleGenAI } from "@google/genai";

// Fixed: Initializing GoogleGenAI using only process.env.API_KEY as per guidelines.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const GeminiService = {
  async generatePropertyDescription(details: {
    titulo: string;
    bairro: string;
    cidade: string;
    metragem: number;
    quartos: number;
    valor: number;
  }) {
    try {
      const prompt = `Gere uma descrição curta, vendedora e profissional para um imóvel com os seguintes dados:
      Título: ${details.titulo}
      Bairro: ${details.bairro}, ${details.cidade}
      Área: ${details.metragem}m²
      Quartos: ${details.quartos}
      Valor: R$ ${details.valor.toLocaleString('pt-BR')}
      
      Regras: Use bullet points para os destaques. Seja direto. Máximo 150 palavras.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      // Using .text property to extract output
      return response.text || "Não foi possível gerar a descrição no momento.";
    } catch (error) {
      console.error("Gemini Error:", error);
      return "Erro ao conectar com a IA.";
    }
  },

  async suggestWhatsAppMessage(leadName: string, propertyTitle: string) {
    try {
      const prompt = `Crie uma mensagem curta e simpática para um corretor enviar via WhatsApp para o lead "${leadName}" que se interessou no imóvel "${propertyTitle}". Use um tom profissional mas acessível. Inclua um convite para agendar visita.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      // Using .text property to extract output
      return response.text || "Olá! Recebi seu interesse no imóvel. Quando podemos conversar?";
    } catch (error) {
      return "Olá! Vi seu interesse no imóvel. Vamos agendar uma visita?";
    }
  }
};
