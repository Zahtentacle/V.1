class GeminiService {
  async generatePersonaMessage(name: string, template: string): Promise<string> {
    let msg = template.replace(/{Nama}/gi, name);
    const code = "#" + Math.random().toString(36).substring(2, 6).toUpperCase();
    return msg + " " + code;
  }
}

export default GeminiService;
