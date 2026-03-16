import React, { useRef, useEffect } from 'react';
import { LogEntry } from '../types';
import { Terminal } from 'lucide-react';

interface TerminalLogProps {
  logs: LogEntry[];
}

const TerminalLog: React.FC<TerminalLogProps> = ({ logs }) => {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const getColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'success': return 'text-green-400';
      case 'error': return 'text-red-400';
      case 'warning': return 'text-yellow-400';
      default: return 'text-blue-400';
    }
  };

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden flex flex-col h-full shadow-2xl">
      <div className="bg-zinc-900 px-4 py-2 border-b border-zinc-800 flex items-center gap-2">
        <Terminal size={16} className="text-zinc-400" />
        <span className="text-xs font-mono text-zinc-400">WORKER_DELTA_LOGS</span>
        <div className="ml-auto flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/50"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500/50"></div>
        </div>
      </div>
      <div className="flex-1 p-4 overflow-y-auto font-mono text-xs space-y-1">
        {logs.length === 0 && (
          <div className="text-zinc-600 italic opacity-50">System ready. Waiting for tasks...</div>
        )}
        {logs.map((log) => (
          <div key={log.id} className="flex gap-3 animate-in fade-in slide-in-from-left-2 duration-300">
            <span className="text-zinc-600 shrink-0">[{log.timestamp}]</span>
            <span className={`font-bold shrink-0 w-16 ${log.worker === 'ALPHA' ? 'text-purple-400' : log.worker === 'BETA' ? 'text-orange-400' : log.worker === 'GAMMA' ? 'text-cyan-400' : 'text-zinc-400'}`}>
              {log.worker}
            </span>
            <span className={getColor(log.type)}>{log.message}</span>
          </div>
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
};

export default TerminalLog;
