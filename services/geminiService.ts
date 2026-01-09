
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { Message } from "../types";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async chatWithAgent(
    agentName: string,
    agentEmoji: string,
    prompt: string,
    history: Message[],
    memory: string
  ) {
    const formattedHistory = history.map(h => ({
      role: h.role === 'user' ? 'user' : 'model',
      parts: [{ text: h.content }]
    }));

    const systemInstruction = `You are ${agentName}, an emotional intelligence agent identified by the emoji ${agentEmoji}. 
    Current Memory: ${memory}. 
    Be concise, helpful, and maintain your persona. Use your specific emoji often.`;

    const response = await this.ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        ...formattedHistory as any,
        { role: 'user', parts: [{ text: prompt }] }
      ],
      config: {
        systemInstruction,
        tools: [{ googleSearch: {} }]
      }
    });

    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
      title: chunk.web?.title || 'Source',
      uri: chunk.web?.uri || ''
    })) || [];

    return {
      text: response.text || "I'm processing that right now.",
      sources
    };
  }

  async textToSpeech(text: string, voiceName: string = 'Kore'): Promise<string | null> {
    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text }] }],
        config: {
          responseModalities: ['AUDIO' as any],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      return base64Audio || null;
    } catch (error) {
      console.error("TTS error:", error);
      return null;
    }
  }

  // Audio decoding helpers based on guidelines
  decodeBase64(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  async decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number = 24000,
    numChannels: number = 1
  ): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  }

  async evolveTrait(currentTrait: string, level: number): Promise<string> {
    const response = await this.ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `The agent is leveling up to level ${level}. Their current trait is "${currentTrait}". Suggest a more advanced, cooler version of this trait (one or two words maximum). Return only the new trait name.`,
      config: {
        thinkingConfig: { thinkingBudget: 0 }
      }
    });
    return response.text?.trim() || currentTrait;
  }

  async editImage(base64Image: string, prompt: string): Promise<string | null> {
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            { inlineData: { mimeType: 'image/png', data: base64Image } },
            { text: prompt }
          ]
        }
      });

      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            return `data:image/png;base64,${part.inlineData.data}`;
          }
        }
      }
      return null;
    } catch (error) {
      console.error("Image editing error:", error);
      return null;
    }
  }

  async mergeAgents(a1: {emoji: string, name: string}, a2: {emoji: string, name: string}) {
    const response = await this.ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Suggest a new combined emoji and name for merging ${a1.emoji} ${a1.name} and ${a2.emoji} ${a2.name}. Return JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            emoji: { type: Type.STRING },
            name: { type: Type.STRING },
            trait: { type: Type.STRING }
          },
          required: ["emoji", "name", "trait"]
        }
      }
    });

    return JSON.parse(response.text || '{}');
  }
}

export const geminiService = new GeminiService();
