import React, { useState, useEffect, useMemo } from 'react';
import { Bot, Database, LayoutDashboard, Send, QrCode } from 'lucide-react';

import { AppState, Contact, LogEntry, WorkerStatus } from './types';
import { MOCK_CONTACTS } from './constants';
import TerminalLog from './components/TerminalLog';
import StatCard from './components/StatCard';
import GeminiService from './services/geminiService';

const App: React.FC = () => {
  const [waConnected, setWaConnected] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const [state, setState] = useState<AppState>({
    contacts: [...MOCK_CONTACTS],
    logs: [],
    workerStatus: WorkerStatus.IDLE,
    processedCount: 0,
    otpCode: null,
    workers: []
  });

  const geminiService = useMemo(() => new GeminiService(), []);

  const addLog = (worker: string, message: string) => {
    const log: LogEntry = {
      id: Math.random().toString(36),
      timestamp: new Date().toLocaleTimeString(),
      worker,
      message,
      type: 'info'
    };
    setState(prev => ({ ...prev, logs: [...prev.logs, log] }));
  };

  const connectWA = () => {
    setShowQR(true);
    setTimeout(() => {
      setShowQR(false);
      setWaConnected(true);
      addLog('SYS', 'WA CONNECTED');
    }, 2000);
  };

  useEffect(() => {
    if (state.workerStatus !== WorkerStatus.RUNNING || !waConnected) return;

    const run = async () => {
      const i = state.contacts.findIndex(c => c.status === 'pending');
      if (i === -1) return;

      const contact = state.contacts[i];
      addLog('BOT', `Processing ${contact.name}`);

      const msg = await geminiService.generatePersonaMessage(contact.name, "Halo {Nama}");

      await new Promise(r => setTimeout(r, 1000));

      addLog('SEND', `Sent to ${contact.phone}`);

      setState(prev => ({
        ...prev,
        contacts: prev.contacts.map((c, idx) =>
          idx === i ? { ...c, status: 'sent', message: msg } : c
        )
      }));

      run();
    };

    run();
  }, [state.workerStatus, waConnected]);

  return (
    <div className="p-6 text-white bg-black min-h-screen">

      {!waConnected && (
        <button onClick={connectWA} className="bg-green-600 px-4 py-2 mb-4">
          CONNECT WA
        </button>
      )}

      <button
        onClick={() =>
          setState(p => ({
            ...p,
            workerStatus:
              p.workerStatus === WorkerStatus.IDLE
                ? WorkerStatus.RUNNING
                : WorkerStatus.IDLE
          }))
        }
        className="bg-blue-600 px-4 py-2 mb-4 ml-2"
      >
        START
      </button>

      {showQR && <QrCode size={200} />}

      <div className="grid grid-cols-3 gap-4 mb-4">
        <StatCard label="Queue" value={state.contacts.filter(c => c.status === 'pending').length} icon={Database} color="text-blue-500" />
        <StatCard label="Sent" value={state.contacts.filter(c => c.status === 'sent').length} icon={Send} color="text-green-500" />
        <StatCard label="AI" value="Local" icon={Bot} color="text-purple-500" />
      </div>

      <div className="h-[300px]">
        <TerminalLog logs={state.logs} />
      </div>

    </div>
  );
};

export default App;
