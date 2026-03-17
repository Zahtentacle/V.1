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

  return (
    <div className="bg-black text-xs font-mono p-4 h-full overflow-y-auto border border-zinc-800 rounded-xl">
      {logs.map(log => (
        <div key={log.id}>
          [{log.timestamp}] {log.worker} → {log.message}
        </div>
      ))}
      <div ref={endRef} />
    </div>
  );
};

export default TerminalLog;
