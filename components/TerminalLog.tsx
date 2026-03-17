import React, { useEffect, useRef } from 'react';
import { LogEntry } from '../types';

interface Props {
  logs: LogEntry[];
}

const TerminalLog: React.FC<Props> = ({ logs }) => {
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const getColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'success':
        return 'text-green-400';
      case 'error':
        return 'text-red-400';
      case 'warning':
        return 'text-yellow-400';
      default:
        return 'text-zinc-400';
    }
  };

  return (
    <div className="bg-black border border-zinc-800 rounded-2xl h-full p-4 overflow-y-auto font-mono text-xs">
      
      <div className="mb-3 text-green-500 font-bold">
        ● GHOST TERMINAL ACTIVE
      </div>

      {logs.length === 0 && (
        <div className="text-zinc-600">
          No activity yet...
        </div>
      )}

      {logs.map((log) => (
        <div key={log.id} className="flex gap-2 mb-1">
          <span className="text-zinc-600">[{log.timestamp}]</span>
          <span className="text-purple-400">{log.worker}</span>
          <span className={getColor(log.type)}>
            {log.message}
          </span>
        </div>
      ))}

      <div ref={endRef} />
    </div>
  );
};

export default TerminalLog;
