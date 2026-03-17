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
  const scrollRef = useRef<HTMLDivElement>(null);

  // Logging Helper
  const addLog = (worker: LogEntry['worker'], message: string, type: LogEntry['type'] = 'info') => {
    const newLog: LogEntry = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }),
      worker,
      message,
      type
    };
    setState(prev => ({ ...prev, logs: [...prev.logs, newLog] }));
  };

  // Update specific worker state
  const updateWorker = (id: WorkerActivity['id'], update: Partial<WorkerActivity>) => {
    setState(prev => ({
      ...prev,
      workers: prev.workers.map(w => w.id === id ? { ...w, ...update } : w)
    }));
  };

  // Initial Welcome
  useEffect(() => {
    addLog('SYSTEM', 'Architect Protocol: GEN-3 Active.', 'info');
    addLog('ALPHA', 'Gemini AI Neural Engine Ready.', 'success');
    addLog('DELTA', 'Safety delay thresholds initialized (30s-90s).', 'info');
  }, []);

  const handleConnectWA = () => {
    setShowQR(true);
    addLog('GAMMA', 'Generating secure QR payload...', 'info');
    setTimeout(() => {
      setShowQR(false);
      setWaConnected(true);
      addLog('GAMMA', 'WhatsApp Pair SUCCESS. Session secure.', 'success');
      updateWorker('GAMMA', { status: 'active', load: 20 });
    }, 3000);
  };

  const handleImport = () => {
    setIsImporting(true);
    setTimeout(() => {
      const lines = importText.split('\n').filter(l => l.trim() !== "");
      const newContacts: Contact[] = lines.map((line, idx) => {
        const [name, phone] = line.split(',').map(s => s.trim());
        return {
          id: `imp-${Date.now()}-${idx}`,
          name: name || `User ${idx}`,
          phone: phone || '0',
          status: 'pending'
        };
      });
      setState(prev => ({ ...prev, contacts: [...prev.contacts, ...newContacts] }));
      setImportText("");
      setIsImporting(false);
      addLog('SYSTEM', `Imported ${newContacts.length} targets successfully.`, 'success');
    }, 1000);
  };

  const clearCompleted = () => {
    setState(prev => ({
      ...prev,
      contacts: prev.contacts.filter(c => c.status !== 'sent')
    }));
    addLog('SYSTEM', 'History cleared. Resetting workspace.', 'info');
  };

  // Main Blasting Engine
  useEffect(() => {
    if (state.workerStatus !== WorkerStatus.RUNNING || !waConnected) return;

    let isCancelled = false;

    const processNext = async () => {
      if (isCancelled) return;

      const nextIndex = state.contacts.findIndex(c => c.status === 'pending');
      
      if (nextIndex === -1) {
        setState(prev => ({ ...prev, workerStatus: WorkerStatus.IDLE }));
        addLog('GAMMA', 'Queue cleared. Campaign cycle finished.', 'success');
        updateWorker('ALPHA', { status: 'idle', load: 0 });
        updateWorker('GAMMA', { status: 'idle', load: 0 });
        return;
      }

      const contact = state.contacts[nextIndex];
      
      setState(prev => ({
        ...prev,
        contacts: prev.contacts.map((c, i) => i === nextIndex ? { ...c, status: 'processing' } : c)
      }));

      // Worker Alpha: Generate Persona
      updateWorker('ALPHA', { status: 'active', load: 85 });
      addLog('ALPHA', `Optimizing message for ${contact.name}...`, 'info');
      const finalMessage = await geminiService.generatePersonaMessage(contact.name, messageTemplate);
      updateWorker('ALPHA', { status: 'idle', load: 10 });

      // Worker Delta: Safety Delay
      updateWorker('DELTA', { status: 'active', load: 95 });
      const delay = 5000 + Math.random() * 5000;
      addLog('DELTA', `Anti-ban jitter: ${Math.round(delay/1000)}s pause.`, 'warning');
      await new Promise(r => setTimeout(r, delay));
      updateWorker('DELTA', { status: 'active', load: 5 });

      if (isCancelled) return;

      // Worker Gamma: Send
      updateWorker('GAMMA', { status: 'active', load: 70 });
      addLog('GAMMA', `Payload sent to ${contact.phone}`, 'success');
      
      setState(prev => ({
        ...prev,
        processedCount: prev.processedCount + 1,
        contacts: prev.contacts.map((c, i) => i === nextIndex ? { 
          ...c, 
          status: 'sent', 
          message: finalMessage,
          timestamp: new Date().toLocaleTimeString() 
        } : c)
      }));

      processNext();
    };

    processNext();
    return () => { isCancelled = true; };
  }, [state.workerStatus, waConnected, state.contacts, messageTemplate, geminiService]);

  const toggleWorker = () => {
    if (!waConnected) {
      addLog('GAMMA', 'CONNECTION_REQUIRED: Link WhatsApp device.', 'error');
      alert("Please link your WhatsApp device first!");
      return;
    }
    const isStarting = state.workerStatus === WorkerStatus.IDLE;
    setState(prev => ({ ...prev, workerStatus: isStarting ? WorkerStatus.RUNNING : WorkerStatus.IDLE }));
    addLog('SYSTEM', isStarting ? 'Engine sequence: INITIALIZED.' : 'Engine sequence: HALTED.', isStarting ? 'success' : 'warning');
  };

  const currentTermuxScript = useMemo(() => {
    return NODE_SCRIPT_TEMPLATE
      .replace('const GOOGLE_API_KEY = "YOUR_API_KEY_HERE";', `const GOOGLE_API_KEY = "ENCRYPTED_API_KEY";`)
      .replace('template || "Halo {Nama}!"', `template || "${messageTemplate}"`);
  }, [messageTemplate]);

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex font-sans selection:bg-green-500/30 overflow-hidden">
      
      {/* Sidebar */}
      <div className="w-64 border-r border-zinc-800 bg-zinc-950 flex flex-col fixed h-full z-10">
        <div className="p-6 border-b border-zinc-800">
          <div className="flex items-center gap-3 text-green-500 mb-1">
            <Bot size={28} className="animate-pulse" />
            <h1 className="font-bold text-lg tracking-tight text-white uppercase italic">Gen-3 Agent</h1>
          </div>
          <p className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase opacity-70">Automated Core</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all ${activeTab === 'dashboard' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'}`}>
            <LayoutDashboard size={18} /> Dashboard
          </button>
          <button onClick={() => setActiveTab('campaign')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all ${activeTab === 'campaign' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'}`}>
            <Database size={18} /> Targets & Template
          </button>
          <button onClick={() => setActiveTab('export')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all ${activeTab === 'export' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'}`}>
            <Smartphone size={18} /> Termux Export
          </button>
          <button onClick={() => setActiveTab('settings')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all ${activeTab === 'settings' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'}`}>
            <Settings size={18} /> System Config
          </button>
        </nav>

        <div className="p-4 border-t border-zinc-800 space-y-2">
            <div className={`rounded p-3 text-xs font-mono flex items-center gap-2 ${waConnected ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                {waConnected ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
                {waConnected ? 'GATEWAY_ONLINE' : 'GATEWAY_OFFLINE'}
            </div>
            {!waConnected && (
              <button onClick={handleConnectWA} className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded text-xs flex items-center justify-center gap-2 font-bold transition-all shadow-lg shadow-green-900/40">
                <QrCode size={14} /> LINK_WA_DEVICE
              </button>
            )}
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 ml-64 h-screen overflow-y-auto p-8 custom-scrollbar">
        <header className="flex justify-between items-center mb-8 pb-6 border-b border-zinc-900/50">
            <div>
                <h2 className="text-3xl font-black text-white tracking-tighter uppercase mb-1">{activeTab}</h2>
                <div className="flex items-center gap-2">
                    <span className={`flex h-2 w-2 rounded-full ${state.workerStatus === WorkerStatus.RUNNING ? 'bg-green-500 animate-pulse' : 'bg-zinc-700'}`}></span>
                    <p className="text-zinc-500 text-[10px] font-mono tracking-widest uppercase">Kernel Version 3.1.5-FLASH</p>
                </div>
            </div>
            <div className="flex items-center gap-4">
                <button 
                  onClick={toggleWorker} 
                  disabled={!waConnected}
                  className={`flex items-center gap-2 px-8 py-3 rounded-lg font-black text-xs transition-all tracking-[0.2em] uppercase disabled:opacity-50 ${state.workerStatus === WorkerStatus.RUNNING ? 'bg-red-600 hover:bg-red-700 shadow-xl shadow-red-900/40' : 'bg-green-600 hover:bg-green-700 shadow-xl shadow-green-900/40'}`}
                >
                    {state.workerStatus === WorkerStatus.RUNNING ? <><Zap size={16} className="animate-spin" /> DISENGAGE</> : <><Play size={16} /> ENGAGE_ENGINE</>}
                </button>
            </div>
        </header>

        {showQR && (
          <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center backdrop-blur-xl">
            <div className="bg-zinc-950 p-12 rounded-[2rem] border border-zinc-800 flex flex-col items-center max-w-sm text-center shadow-[0_0_100px_rgba(34,197,94,0.1)]">
              <div className="bg-white p-6 rounded-2xl mb-8 border-[6px] border-green-500/20">
                <QrCode size={200} className="text-black" />
              </div>
              <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-tighter">Handshake Protocol</h3>
              <p className="text-zinc-500 text-xs mb-8 leading-relaxed font-mono uppercase">Syncing local instance with WA Cloud...</p>
              <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                <div className="bg-green-500 h-full animate-[progress_3s_linear]"></div>
              </div>
              <style>{`@keyframes progress { 0% { width: 0% } 100% { width: 100% } }`}</style>
            </div>
          </div>
        )}

        {activeTab === 'dashboard' && (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard label="Live Queue" value={state.contacts.filter(c => c.status === 'pending').length} icon={Database} color="text-blue-500" />
                    <StatCard label="Payloads Delivered" value={state.contacts.filter(c => c.status === 'sent').length} icon={Send} color="text-green-500" />
                    <StatCard label="Success Rate" value={`${Math.round((state.contacts.filter(c => c.status === 'sent').length / (state.contacts.length || 1)) * 100)}%`} icon={Zap} color="text-yellow-500" />
                    <StatCard label="Neural Model" value="Gemini 3" icon={Bot} color="text-purple-500" subtext="Flash Preview Active" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left: Logs */}
                    <div className="lg:col-span-8 h-[550px]">
                        <TerminalLog logs={state.logs} />
                    </div>

                    {/* Right: Worker Activity */}
                    <div className="lg:col-span-4 space-y-4">
                        <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl p-6 backdrop-blur-sm flex flex-col h-full overflow-hidden">
                            <h3 className="text-[10px] font-black text-zinc-500 mb-6 flex items-center gap-2 uppercase tracking-widest border-b border-zinc-800 pb-4">
                                <Activity size={14} className="text-green-500" /> Worker Sub-Systems
                            </h3>
                            <div className="space-y-6 flex-1 overflow-y-auto">
                                {state.workers.map(worker => (
                                    <div key={worker.id} className="group">
                                        <div className="flex justify-between items-center mb-2">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-1.5 h-1.5 rounded-full ${worker.status === 'active' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-zinc-600'}`}></div>
                                                <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-tight">{worker.name}</span>
                                            </div>
                                            <span className="text-[10px] font-mono text-zinc-500 uppercase">{worker.status}</span>
                                        </div>
                                        <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full transition-all duration-1000 ${worker.load > 80 ? 'bg-red-500' : worker.load > 50 ? 'bg-yellow-500' : 'bg-green-500'}`} 
                                                style={{ width: `${worker.load}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-6 pt-6 border-t border-zinc-800">
                                <h4 className="text-[10px] font-black text-zinc-500 mb-4 uppercase tracking-widest flex items-center gap-2">
                                    <MessageSquare size={12} /> Persona Buffer
                                </h4>
                                <div className="bg-black/40 rounded-xl p-4 h-48 overflow-y-auto border border-zinc-800/50 custom-scrollbar font-mono">
                                    {state.contacts.filter(c => c.status === 'sent').length > 0 ? (
                                        <div className="space-y-4">
                                            {state.contacts.filter(c => c.status === 'sent').slice(-3).reverse().map(c => (
                                                <div key={c.id} className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                                                    <div className="text-[9px] text-zinc-500 mb-1 flex justify-between uppercase">
                                                        <span>To: {c.name}</span>
                                                        <span className="text-green-500/60">{c.timestamp}</span>
                                                    </div>
                                                    <p className="text-[10px] text-zinc-400 leading-relaxed border-l border-zinc-700 pl-3 line-clamp-2 italic">"{c.message}"</p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full text-zinc-800/40 text-[9px] uppercase font-bold tracking-[0.2em]">
                                            <MessageSquare size={24} className="mb-2 opacity-20" />
                                            Empty Buffer
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'campaign' && (
             <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Template Editor */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Bot size={120} />
                        </div>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
                                <MessageSquare size={18} className="text-green-500" /> Neural Template
                            </h3>
                            <div className="flex items-center gap-2 px-3 py-1 bg-zinc-800 rounded-full border border-zinc-700">
                                <span className="text-[8px] font-mono text-zinc-400">VAR_INJECTION:</span>
                                <span className="text-[8px] font-black text-green-500 font-mono">{`{Nama}`}</span>
                            </div>
                        </div>
                        <textarea 
                            className="w-full bg-black/60 border border-zinc-700/50 rounded-xl p-6 text-sm text-zinc-200 focus:ring-2 focus:ring-green-500/30 focus:border-green-500/50 outline-none h-48 font-mono resize-none transition-all placeholder:text-zinc-700"
                            value={messageTemplate}
                            onChange={(e) => setMessageTemplate(e.target.value)}
                            placeholder="Type your base payload here..."
                        />
                        <p className="mt-4 text-[10px] text-zinc-500 font-medium italic">"Worker Alpha will rewrite this message per-contact to avoid fingerprinting."</p>
                    </div>

                    {/* Import Section */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl">
                         <div className="flex items-center justify-between mb-6">
                            <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
                                <UserPlus size={18} className="text-blue-500" /> Target Bulk Import
                            </h3>
                            <button 
                                onClick={() => setImportText("Budi Santoso, 6281234567890\nSiti Aminah, 6289876543210")}
                                className="text-[9px] font-bold text-zinc-500 hover:text-white transition-colors uppercase underline"
                            >
                                LOAD_SAMPLE
                            </button>
                        </div>
                        <textarea 
                            className="w-full bg-black/60 border border-zinc-700/50 rounded-xl p-6 text-sm text-zinc-200 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 outline-none h-48 font-mono resize-none transition-all placeholder:text-zinc-700"
                            value={importText}
                            onChange={(e) => setImportText(e.target.value)}
                            placeholder="Format: Name, PhoneNumber (One per line)"
                        />
                        <button 
                            onClick={handleImport}
                            disabled={!importText.trim() || isImporting}
                            className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all disabled:opacity-30 flex items-center justify-center gap-2"
                        >
                            {isImporting ? <RefreshCw size={14} className="animate-spin" /> : <Upload size={14} />} INJECT_TARGETS
                        </button>
                    </div>
                </div>

                <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
                    <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/80 backdrop-blur-md">
                        <div className="flex items-center gap-4">
                            <h3 className="font-black text-white uppercase text-xs tracking-widest">Active Database</h3>
                            <span className="text-[10px] px-2 py-0.5 bg-zinc-800 rounded text-zinc-500 font-mono">{state.contacts.length} ENTRIES</span>
                        </div>
                        <div className="flex gap-2">
                            <button 
                                onClick={clearCompleted}
                                className="px-4 py-1.5 text-[10px] font-black text-red-500 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 rounded-md transition-all flex items-center gap-2 uppercase tracking-tighter"
                            >
                                <Trash2 size={12} /> PURGE_HISTORY
                            </button>
                        </div>
                    </div>
                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                        <table className="w-full text-sm text-left border-collapse">
                            <thead className="bg-black/80 sticky top-0 z-10 text-zinc-500 font-mono uppercase text-[9px] tracking-[0.2em] border-b border-zinc-800">
                                <tr>
                                    <th className="px-8 py-4">Identification</th>
                                    <th className="px-8 py-4">Terminal No.</th>
                                    <th className="px-8 py-4">Status Code</th>
                                    <th className="px-8 py-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800/40">
                                {state.contacts.map((c) => (
                                    <tr key={c.id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-500">
                                                    {c.name.charAt(0)}
                                                </div>
                                                <span className="font-bold text-zinc-300 tracking-tight">{c.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-zinc-500 font-mono text-xs">{c.phone}</td>
                                        <td className="px-8 py-5">
                                            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black tracking-widest uppercase ${
                                                c.status === 'sent' ? 'bg-green-500/10 text-green-500 border border-green-500/20 shadow-[0_0_10px_rgba(34,197,94,0.1)]' : 
                                                c.status === 'processing' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20 animate-pulse' :
                                                'bg-zinc-800 text-zinc-600'
                                            }`}>
                                                {c.status}
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <button 
                                                onClick={() => setState(prev => ({ ...prev, contacts: prev.contacts.filter(con => con.id !== c.id) }))}
                                                className="p-2 text-zinc-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
             </div>
        )}

        {activeTab === 'export' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 flex flex-col shadow-2xl">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                          <h3 className="text-lg font-black text-white flex items-center gap-2 uppercase tracking-tighter">
                            <Code size={20} className="text-green-500" /> TERMUX_RUNTIME.JS
                          </h3>
                          <p className="text-zinc-500 text-[10px] font-mono mt-1 uppercase tracking-widest opacity-60">Production Deployable Code</p>
                        </div>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(currentTermuxScript);
                            addLog('SYSTEM', 'Engine script copied to clipboard.', 'success');
                          }} 
                          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl text-xs font-black transition-all shadow-lg shadow-green-900/40 uppercase tracking-widest"
                        >
                          <Save size={14} /> COPY_SOURCE
                        </button>
                    </div>
                    <div className="flex-1 bg-black/80 rounded-2xl p-6 font-mono text-[11px] text-zinc-400 overflow-auto border border-zinc-800 shadow-inner custom-scrollbar">
                      <pre className="text-green-500/70 leading-relaxed whitespace-pre-wrap">{currentTermuxScript}</pre>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl">
                        <h3 className="text-lg font-black text-white flex items-center gap-2 uppercase tracking-tighter mb-6">
                            <Terminal size={20} className="text-blue-500" /> DEPLOYMENT_LOGISTICS
                        </h3>
                        
                        <div className="space-y-6">
                            <div className="space-y-3">
                                <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div> PHASE 01: ENVIRONMENT
                                </h4>
                                <div className="bg-black/50 p-5 rounded-xl font-mono text-[11px] text-green-500 border border-zinc-800 leading-relaxed">
                                    pkg update && pkg upgrade -y<br/>
                                    pkg install nodejs git -y<br/>
                                    npm install -g pm2
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div> PHASE 02: KERNEL SETUP
                                </h4>
                                <div className="bg-black/50 p-5 rounded-xl font-mono text-[11px] text-green-500 border border-zinc-800 leading-relaxed">
                                    mkdir gen3-bot && cd gen3-bot<br/>
                                    npm init -y<br/>
                                    npm i @whiskeysockets/baileys @google/genai pino qrcode-terminal
                                </div>
                            </div>

                            <div className="bg-blue-500/10 p-5 rounded-xl border border-blue-500/20">
                                <div className="flex items-start gap-3">
                                    <ShieldAlert size={18} className="text-blue-500 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-blue-400 text-[10px] font-black uppercase tracking-widest mb-1">PRO-TIP: Anti-Fingerprinting</p>
                                        <p className="text-zinc-400 text-[11px] leading-relaxed italic">
                                            "Using the exported script on a real Android device via Termux provides the most natural behavior signatures, significantly reducing detection risk compared to cloud servers."
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'settings' && (
           <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-10 max-w-2xl shadow-2xl animate-in fade-in zoom-in duration-500">
              <div className="flex items-center gap-4 mb-10 border-b border-zinc-800 pb-8">
                  <div className="p-4 bg-zinc-800 rounded-2xl text-green-500">
                      <Settings size={32} />
                  </div>
                  <div>
                      <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Engine Configuration</h3>
                      <p className="text-zinc-500 text-[10px] font-mono uppercase tracking-[0.3em]">GEN-3 Kernel Access</p>
                  </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center p-6 bg-black/40 rounded-2xl border border-zinc-800 transition-all hover:border-purple-500/30 group">
                  <div className="flex flex-col">
                      <span className="text-zinc-400 text-[10px] font-black uppercase tracking-widest mb-1">Neural Architecture</span>
                      <span className="text-zinc-500 text-[11px]">Primary AI processing unit</span>
                  </div>
                  <span className="text-purple-500 font-mono text-xs font-black px-4 py-2 bg-purple-500/10 rounded-lg border border-purple-500/20">Gemini 3 Flash</span>
                </div>

                <div className="flex justify-between items-center p-6 bg-black/40 rounded-2xl border border-zinc-800 transition-all hover:border-blue-500/30">
                  <div className="flex flex-col">
                      <span className="text-zinc-400 text-[10px] font-black uppercase tracking-widest mb-1">Gateway Protocol</span>
                      <span className="text-zinc-500 text-[11px]">WebSocket abstraction layer</span>
                  </div>
                  <span className="text-blue-500 font-mono text-xs font-black px-4 py-2 bg-blue-500/10 rounded-lg border border-blue-500/20">Baileys Multidevice</span>
                </div>

                <div className="flex justify-between items-center p-6 bg-black/40 rounded-2xl border border-zinc-800 transition-all hover:border-green-500/30">
                  <div className="flex flex-col">
                      <span className="text-zinc-400 text-[10px] font-black uppercase tracking-widest mb-1">Safety Protocols</span>
                      <span className="text-zinc-500 text-[11px]">Anti-ban & Jitter logic</span>
                  </div>
                  <span className="text-green-500 font-mono text-xs font-black px-4 py-2 bg-green-500/10 rounded-lg border border-green-500/20">ACTIVE_V3.1</span>
                </div>

                <div className="flex justify-between items-center p-6 bg-black/40 rounded-2xl border border-zinc-800">
                  <div className="flex flex-col">
                      <span className="text-zinc-400 text-[10px] font-black uppercase tracking-widest mb-1">Build ID</span>
                      <span className="text-zinc-500 text-[11px]">Core software versioning</span>
                  </div>
                  <span className="text-zinc-600 font-mono text-[10px]">2025.ARCHITECT.PRO</span>
                </div>
              </div>
              
              <div className="mt-12 flex justify-center">
                  <div className="flex items-center gap-2 text-[10px] text-zinc-600 font-mono tracking-[0.4em] uppercase">
                      <Bot size={12} className="opacity-40" />
                      Gen-3 Automation Systems
                  </div>
              </div>
           </div>
        )}
      </main>
    </div>
  );
};

export default App;
