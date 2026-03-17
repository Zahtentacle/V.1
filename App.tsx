import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Activity, Bot, Database, LayoutDashboard, MessageSquare, Play, RefreshCw, 
  Save, Send, Settings, Smartphone, Terminal, ShieldAlert, QrCode, Info, 
  CheckCircle2, AlertTriangle, UserPlus, Upload, Trash2, Code, Zap
} from 'lucide-react';
import { AppState, Contact, LogEntry, WorkerStatus, WorkerActivity } from './types';
import { MOCK_CONTACTS, NODE_SCRIPT_TEMPLATE } from './constants';
import TerminalLog from './components/TerminalLog';
import StatCard from './components/StatCard';
import { GeminiService } from './services/geminiService';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'campaign' | 'settings' | 'export'>('dashboard');
  const [waConnected, setWaConnected] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [importText, setImportText] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  
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

  const [messageTemplate, setMessageTemplate] = useState("Halo {Nama}, kami ada promo menarik khusus hari ini. Silakan cek katalog kami ya.");
  const geminiService = useMemo(() => new GeminiService(), []);

  const addLog = (worker: LogEntry['worker'], message: string, type: LogEntry['type'] = 'info') => {
    const newLog: LogEntry = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }),
      worker, message, type
    };
    setState(prev => ({ ...prev, logs: [...prev.logs, newLog] }));
  };

  const updateWorker = (id: WorkerActivity['id'], update: Partial<WorkerActivity>) => {
    setState(prev => ({
      ...prev,
      workers: prev.workers.map(w => w.id === id ? { ...w, ...update } : w)
    }));
  };

  useEffect(() => {
    addLog('SYSTEM', 'Architect Protocol: GEN-3 Active.', 'info');
    addLog('ALPHA', 'Gemini AI Neural Engine Ready.', 'success');
  }, []);

  const handleConnectWA = () => {
    setShowQR(true);
    addLog('GAMMA', 'Generating secure QR payload...', 'info');
    setTimeout(() => {
      setShowQR(false);
      setWaConnected(true);
      addLog('GAMMA', 'WhatsApp Pair SUCCESS.', 'success');
    }, 3000);
  };

  const handleImport = () => {
    setIsImporting(true);
    setTimeout(() => {
      const lines = importText.split('\n').filter(l => l.trim() !== "");
      const newContacts: Contact[] = lines.map((line, idx) => {
        const [name, phone] = line.split(',').map(s => s.trim());
        return { id: `imp-${Date.now()}-${idx}`, name: name || `User ${idx}`, phone: phone || '0', status: 'pending' };
      });
      setState(prev => ({ ...prev, contacts: [...prev.contacts, ...newContacts] }));
      setImportText("");
      setIsImporting(false);
    }, 1000);
  };

  useEffect(() => {
    if (state.workerStatus !== WorkerStatus.RUNNING || !waConnected) return;
    let isCancelled = false;
    const processNext = async () => {
      if (isCancelled) return;
      const nextIndex = state.contacts.findIndex(c => c.status === 'pending');
      if (nextIndex === -1) {
        setState(prev => ({ ...prev, workerStatus: WorkerStatus.IDLE }));
        return;
      }
      const contact = state.contacts[nextIndex];
      setState(prev => ({ ...prev, contacts: prev.contacts.map((c, i) => i === nextIndex ? { ...c, status: 'processing' } : c) }));
      const finalMessage = await geminiService.generatePersonaMessage(contact.name, messageTemplate);
      await new Promise(r => setTimeout(r, 3000));
      if (isCancelled) return;
      setState(prev => ({
        ...prev, processedCount: prev.processedCount + 1,
        contacts: prev.contacts.map((c, i) => i === nextIndex ? { ...c, status: 'sent', message: finalMessage, timestamp: new Date().toLocaleTimeString() } : c)
      }));
      processNext();
    };
    processNext();
    return () => { isCancelled = true; };
  }, [state.workerStatus, waConnected, state.contacts, messageTemplate, geminiService]);

  const toggleWorker = () => {
    if (!waConnected) return alert("Please link WhatsApp first!");
    setState(prev => ({ ...prev, workerStatus: prev.workerStatus === WorkerStatus.IDLE ? WorkerStatus.RUNNING : WorkerStatus.IDLE }));
  };

  const currentTermuxScript = useMemo(() => {
    return NODE_SCRIPT_TEMPLATE.replace('YOUR_API_KEY_HERE', "ENCRYPTED").replace('{Nama}', messageTemplate);
  }, [messageTemplate]);
  return (
    <div className="min-h-screen bg-black text-zinc-100 flex font-sans overflow-hidden">
      <div className="w-64 border-r border-zinc-800 bg-zinc-950 flex flex-col fixed h-full z-10">
        <div className="p-6 border-b border-zinc-800">
          <div className="flex items-center gap-3 text-green-500 mb-1">
            <Bot size={28} className="animate-pulse" />
            <h1 className="font-bold text-lg tracking-tight text-white uppercase italic">Gen-3 Agent</h1>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm ${activeTab === 'dashboard' ? 'bg-green-500/10 text-green-400' : 'text-zinc-400'}`}>
            <LayoutDashboard size={18} /> Dashboard
          </button>
          <button onClick={() => setActiveTab('campaign')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm ${activeTab === 'campaign' ? 'bg-green-500/10 text-green-400' : 'text-zinc-400'}`}>
            <Database size={18} /> Campaign
          </button>
          <button onClick={() => setActiveTab('export')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm ${activeTab === 'export' ? 'bg-green-500/10 text-green-400' : 'text-zinc-400'}`}>
            <Smartphone size={18} /> Export
          </button>
        </nav>
        <div className="p-4 border-t border-zinc-800">
            {!waConnected && (
              <button onClick={handleConnectWA} className="w-full bg-green-600 py-2 rounded text-xs font-bold text-white">LINK_WA</button>
            )}
        </div>
      </div>

      <main className="flex-1 ml-64 h-screen overflow-y-auto p-8">
        <header className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-black text-white uppercase">{activeTab}</h2>
            <button onClick={toggleWorker} className={`px-8 py-3 rounded-lg font-black text-xs ${state.workerStatus === WorkerStatus.RUNNING ? 'bg-red-600' : 'bg-green-600'}`}>
                {state.workerStatus === WorkerStatus.RUNNING ? 'STOP' : 'START'}
            </button>
        </header>

        {showQR && (
          <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-2xl"><QrCode size={200} className="text-black" /></div>
          </div>
        )}

        {activeTab === 'dashboard' && (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StatCard label="Queue" value={state.contacts.filter(c => c.status === 'pending').length} icon={Database} color="text-blue-500" />
                    <StatCard label="Sent" value={state.contacts.filter(c => c.status === 'sent').length} icon={Send} color="text-green-500" />
                    <StatCard label="Model" value="Gemini 3" icon={Bot} color="text-purple-500" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-8 h-[500px]"><TerminalLog logs={state.logs} /></div>
                    <div className="lg:col-span-4 bg-zinc-900/40 p-6 rounded-2xl border border-zinc-800">
                        <h3 className="text-xs font-bold text-zinc-500 mb-6 uppercase">Workers</h3>
                        {state.workers.map(w => (
                            <div key={w.id} className="mb-6">
                                <div className="flex justify-between text-[10px] mb-2 uppercase"><span>{w.name}</span><span>{w.load}%</span></div>
                                <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden"><div className="h-full bg-green-500" style={{width: `${w.load}%`}}></div></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'campaign' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-zinc-900 p-8 rounded-2xl border border-zinc-800">
                    <h3 className="text-sm font-bold mb-4 uppercase">Neural Template</h3>
                    <textarea className="w-full bg-black border border-zinc-800 rounded-xl p-4 h-48 text-sm font-mono" value={messageTemplate} onChange={(e) => setMessageTemplate(e.target.value)} />
                </div>
                <div className="bg-zinc-900 p-8 rounded-2xl border border-zinc-800">
                    <h3 className="text-sm font-bold mb-4 uppercase">Bulk Import (Name, Phone)</h3>
                    <textarea className="w-full bg-black border border-zinc-800 rounded-xl p-4 h-48 text-sm font-mono" placeholder="Budi, 62812345678" value={importText} onChange={(e) => setImportText(e.target.value)} />
                    <button onClick={handleImport} className="w-full mt-4 bg-blue-600 py-3 rounded-xl font-bold text-xs uppercase">Inject Targets</button>
                </div>
            </div>
        )}
      </main>
    </div>
  );
};

export default App;
             
