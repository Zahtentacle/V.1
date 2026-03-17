import { GoogleGenerativeAI } from "@google/genai";

export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    // API Key akan diambil dari environment variable di Vercel/Termux
    const apiKey = "DUMMY_KEY"; 
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  }

  async generatePersonaMessage(name: string, template: string): Promise<string> {
    try {
      // Logika sederhana untuk simulasi jika API Key belum diset
      return template.replace(/{Nama}/g, name);
    } catch (error) {
      console.error("Gemini Error:", error);
      return template.replace(/{Nama}/g, name);
    }
  }
}
