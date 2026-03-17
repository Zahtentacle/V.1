class GeminiService {
  async generatePersonaMessage(name: string, template: string): Promise<string> {
    try {
      // Replace placeholder {Nama}
      let message = template.replace(/{Nama}/gi, name);

      // Variasi biar natural
      const variations = [
        "",
        " Jangan sampai ketinggalan ya!",
        " Promo terbatas hari ini.",
        " Langsung cek sekarang juga.",
        " Kesempatan tidak datang dua kali."
      ];

      const randomVariation = variations[Math.floor(Math.random() * variations.length)];

      // Random code (GHOST style)
      const randomCode = "#" + Math.random().toString(36).substring(2, 6).toUpperCase();

      return message + randomVariation + " " + randomCode;

    } catch (err) {
      return template.replace(/{Nama}/gi, name) + " #" + Math.random().toString(36).substring(2, 6).toUpperCase();
    }
  }
}

export default GeminiService;
