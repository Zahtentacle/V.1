export const DEFAULT_TEMPLATE = "Halo {Nama}, kami ada promo menarik khusus hari ini. Silakan cek katalog kami ya.";

export const MOCK_CONTACTS = [
  { id: '1', name: 'Budi Santoso', phone: '6281234567890', status: 'pending' },
  { id: '2', name: 'Siti Aminah', phone: '6289876543210', status: 'pending' },
  { id: '3', name: 'Dewi Lestari', phone: '6281122334455', status: 'pending' },
  { id: '4', name: 'Rizky Pratama', phone: '6285566778899', status: 'pending' },
  { id: '5', name: 'Andi Wijaya', phone: '6287788990011', status: 'pending' },
] as const;

export const NODE_SCRIPT_TEMPLATE = `/**
 * WA Business Multi-Account Blaster & SMS Gateway
 * Runtime: Node.js (Termux)
 * Author: GEN-3 AGENT
 */

const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const { GoogleGenAI } = require('@google/genai');
const { exec } = require('child_process');
const fs = require('fs');
const pino = require('pino');

// --- CONFIGURATION ---
const GOOGLE_API_KEY = "YOUR_API_KEY_HERE"; 
const SESSION_DIR = './sessions';
const DATA_FILE = './data/contacts.json';
const MIN_DELAY = 30000; // 30s
const MAX_DELAY = 90000; // 90s
const BATCH_SIZE = 20;
const SLEEP_TIME = 300000; // 5 mins

// --- WORKER ALPHA: THE MIMIC (AI) ---
const genAI = new GoogleGenAI({ apiKey: GOOGLE_API_KEY });

async function generateAIPersona(name, template) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
    const prompt = \`
      Rewrite the following message for a WhatsApp user named "\${name}".
      Rules:
      1. Use casual Indonesian.
      2. Address them as "Ka" or "Kaka".
      3. Make it friendly and include 1 minor "human" typo to look natural.
      4. Append a unique code like #\${Math.floor(Math.random() * 10000)} at the end.
      5. Original Template: "\${template}"
    \`;
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    console.error('[ALPHA] AI Error:', error.message);
    return template.replace('{Nama}', name) + " #" + Date.now(); // Fallback
  }
}

// --- WORKER BETA: THE LISTENER (SMS) ---
function smsListener(callback) {
  console.log('[BETA] Listening for WhatsApp OTP...');
  setInterval(() => {
    exec('termux-sms-list -l 1', (err, stdout) => {
      if (err) return;
      try {
        const sms = JSON.parse(stdout)[0];
        if (sms && (sms.body.includes('WhatsApp') || sms.body.includes('kode'))) {
          // Simple regex to extract 6 digit code
          const code = sms.body.match(/\\d{3}[-\\s]?\\d{3}/)?.[0]?.replace(/\\D/g, '');
          if (code) callback(code);
        }
      } catch (e) {}
    });
  }, 5000); // Check every 5s
}

// --- WORKER DELTA: THE SAFETY (DELAYS) ---
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const randomDelay = () => Math.floor(Math.random() * (MAX_DELAY - MIN_DELAY + 1) + MIN_DELAY);

// --- WORKER GAMMA: THE PILOT (BLASTER) ---
async function startGammaWorker() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
    logger: pino({ level: 'silent' })
  });

  sock.ev.on('creds.update', saveCreds);
  
  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
      const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
      if (shouldReconnect) startGammaWorker();
    } else if (connection === 'open') {
      console.log('[GAMMA] Connected to WhatsApp!');
      runBlastingLoop(sock);
    }
  });

  // Start Listener for OTP re-verification if needed
  smsListener((code) => {
    console.log(\`[BETA] OTP Captured: \${code} -> Sending to Gamma\`);
    // Logic to auto-input OTP if socket requests it would go here
  });
}

async function runBlastingLoop(sock) {
  const contacts = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  let count = 0;

  for (const contact of contacts) {
    if (contact.status === 'sent') continue;

    console.log(\`[DELTA] Preparing message for \${contact.name}...\`);
    
    // 1. Worker Alpha
    const message = await generateAIPersona(contact.name, contact.template || "Halo {Nama}!");
    
    // 2. Send
    await sock.sendMessage(contact.phone + '@s.whatsapp.net', { text: message });
    console.log(\`[GAMMA] Sent to \${contact.name}: \${message}\`);
    
    // Update local DB
    contact.status = 'sent';
    // (In real app, write back to file here)

    // 3. Worker Delta Safety
    count++;
    if (count % 20 === 0) {
      console.log('[DELTA] Deep Sleep Mode (5 mins)...');
      await sleep(SLEEP_TIME);
    } else {
      const delay = randomDelay();
      console.log(\`[DELTA] Cooling down for \${delay/1000}s...\`);
      await sleep(delay);
    }
  }
}

// Start
startGammaWorker();
`;