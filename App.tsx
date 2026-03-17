import React, { useState, useEffect, useMemo } from 'react';
import { 
  Bot, Database, LayoutDashboard, Send, QrCode
} from 'lucide-react';

import { AppState, Contact, LogEntry, WorkerStatus } from './types';
import { MOCK_CONTACTS } from './constants';
import TerminalLog from './components/TerminalLog';
import StatCard from './components/StatCard';
import GeminiService from './services/geminiService'; // ✅ FIXED

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'campaign'>('dashboard');
  const [waConnected, setWaConnected] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const [state, setState] = useState<AppState>({
    contacts: [...MOCK_CONTACTS],
    logs: [],
    workerStatus: WorkerStatus.IDLE,
    processedCount: 0,
    otpCode: null,
    workers: [
      { id: 'ALPHA', name: 'Neural Engine', status: 'idle', load: 0 },
      { id: 'BETA', name: 'SMS Listener', status: 'active', load: 10 },
      { id: 'GAMMA', name: 'WA Gateway', status: 'idle', load: 0 },
      { id: 'DELTA', name: 'Safety Shield', status: 'active', load: 5 }
    ]
  });

  const [messageTemplate, setMessageTemplate] = useState("Halo {Nama}, kami ada promo menarik khusus hari ini.");

  const geminiService = useMemo(() => new GeminiService(), []);

  const addLog = (worker: LogEntry['worker'], message: string, type: LogEntry['type'] = 'info') => {
    const newLog: LogEntry = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      worker,
      message,
      type
    };
    setState(prev => ({ ...prev, logs: [...prev.logs, newLog] }));
  };

  const handleConnectWA = () => {
    setShowQR(true);
    addLog('GAMMA', 'Generating QR...', 'info');

    setTimeout(() => {
      setShowQR(false);
      setWaConnected(true);
      addLog('GAMMA', 'WhatsApp Connected!', 'success');
    }, 3000);
  };

  useEffect(() => {
    if (state.workerStatus !== WorkerStatus.RUNNING || !waConnected) return;

    let cancelled = false;

    const process = async () => {
      if (cancelled) return;

      const index = state.contacts.findIndex(c => c.status === 'pending');
      if (index === -1) {
        addLog('DELTA', 'All contacts processed.', 'success');
        return;
      }

      const contact = state.contacts[index];

      addLog('ALPHA', `Processing ${contact.name}...`);

      setState(prev => ({
        ...prev,
        contacts: prev.contacts.map((c, i) =>
          i === index ? { ...c, status: 'processing' } : c
        )
      }));

      const msg = await geminiService.generatePersonaMessage(contact.name, messageTemplate);

      addLog('BETA', `Generated message for ${contact.name}`);

      await new Promise(r => setTimeout(r, 2000));

      addLog('GAMMA', `Sent to ${contact.phone}`, 'success');

      setState(prev => ({
        ...prev,
        processedCount: prev.processedCount + 1,
        contacts: prev.contacts.map((c, i) =>
          i === index
            ? { ...c, status: 'sent', message: msg }
            : c
        )
      }));

      process();
    };

    process();

    return () => { cancelled = true; };

  }, [state.workerStatus, waConnected]);

  const toggleWorker = () => {
    if (!waConnected) {
      addLog('DELTA', 'WA NOT CONNECTED!', 'error');
      return;
    }

    setState(prev => ({
      ...prev,
      workerStatus:
        prev.workerStatus === WorkerStatus.IDLE
          ? WorkerStatus.RUNNING
          : WorkerStatus.IDLE
    }));
  };

  return (
    <div className="min-h-screen bg-black text-white flex">

      {/* SIDEBAR */}
      <div className="w-64 bg-zinc-950 p-4">
        <h1 className="text-green-500 font-bold mb-6">GEN-3 AGENT</h1>

        <button onClick={() => setActiveTab('dashboard')} className="block mb-2">
          Dashboard
        </button>

        <button onClick={() => setActiveTab('campaign')} className="block">
          Campaign
        </button>

        {!waConnected && (
          <button onClick={handleConnectWA} className="mt-6 bg-green-600 px-4 py-2">
            LINK WA
          </button>
        )}
      </div>

      {/* MAIN */}
      <div className="flex-1 p-6">

        <button onClick={toggleWorker} className="mb-6 bg-green-600 px-6 py-2">
          {state.workerStatus === WorkerStatus.RUNNING ? 'STOP' : 'START'}
        </button>

        {showQR && (
          <div className="fixed inset-0 bg-black flex items-center justify-center">
            <QrCode size={200} />
          </div>
        )}

        {activeTab === 'dashboard' && (
          <>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <StatCard label="Queue" value={state.contacts.filter(c => c.status === 'pending').length} icon={Database} color="text-blue-500" />
              <StatCard label="Sent" value={state.contacts.filter(c => c.status === 'sent').length} icon={Send} color="text-green-500" />
              <StatCard label="AI" value="Local Engine" icon={Bot} color="text-purple-500" />
            </div>

            <div className="h-[400px]">
              <TerminalLog logs={state.logs} />
            </div>
          </>
        )}

        {activeTab === 'campaign' && (
          <textarea
            className="w-full h-40 bg-black border border-zinc-700 p-4"
            value={messageTemplate}
            onChange={(e) => setMessageTemplate(e.target.value)}
          />
        )}

      </div>
    </div>
  );
};

export default App;
