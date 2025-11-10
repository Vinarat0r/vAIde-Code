import React, { useRef, useEffect } from 'react';
import { TerminalIcon, WandIcon } from './icons';
import { LogEntry } from '../types';

interface ConsoleProps {
  logs: LogEntry[];
  onClear: () => void;
  onFixCode: () => void;
  isFixing: boolean;
}

const formatMessage = (msg: any): string => {
  if (typeof msg === 'string') return msg;
  if (msg instanceof Error) return msg.message;
  try {
    return JSON.stringify(msg, null, 2);
  } catch {
    return String(msg);
  }
};

const getLogLevelClass = (level: string): string => {
  switch (level) {
    case 'error':
      return 'text-red-500 dark:text-red-400 border-l-red-500';
    case 'warn':
      return 'text-yellow-600 dark:text-yellow-400 border-l-yellow-500';
    default:
      return 'text-text-secondary-light dark:text-text-secondary-dark border-l-gray-400';
  }
};

const Console: React.FC<ConsoleProps> = ({ logs, onClear, onFixCode, isFixing }) => {
  const consoleBodyRef = useRef<HTMLDivElement>(null);
  const hasErrors = logs.some(log => log.level === 'error');

  useEffect(() => {
    if (consoleBodyRef.current) {
      consoleBodyRef.current.scrollTop = consoleBodyRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="flex flex-col h-full bg-surface-light dark:bg-surface-dark rounded-lg border border-border-light dark:border-border-dark shadow-md">
      <div className="flex items-center justify-between p-2 border-b border-border-light dark:border-border-dark shrink-0">
        <h2 className="text-sm font-semibold flex items-center gap-2 text-text-primary-light dark:text-text-primary-dark">
          <TerminalIcon className="w-4 h-4" />
          Console
        </h2>
        <div className="flex items-center gap-2">
           <button
            onClick={onFixCode}
            className="flex items-center gap-1 px-2 py-1 text-xs rounded-md transition-colors bg-secondary-light/20 text-secondary-light dark:bg-secondary-dark/20 dark:text-secondary-dark hover:bg-secondary-light/30 dark:hover:bg-secondary-dark/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-200 dark:disabled:bg-gray-700 disabled:text-text-secondary-light dark:disabled:text-text-secondary-dark"
            title="Attempt to fix errors with AI"
            disabled={!hasErrors || isFixing}
          >
            {isFixing ? (
                 <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            ) : (
                <WandIcon className="w-4 h-4" />
            )}
            Fix with AI
          </button>
          <button
            onClick={onClear}
            className="px-2 py-1 text-xs rounded-md transition-colors bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 disabled:opacity-50"
            title="Clear console"
            disabled={logs.length === 0}
          >
            Clear
          </button>
        </div>
      </div>
      <div ref={consoleBodyRef} className="flex-grow overflow-y-auto p-2 font-mono text-xs bg-background-light dark:bg-background-dark">
        {logs.length === 0 ? (
          <p className="text-text-secondary-light dark:text-text-secondary-dark">No logs yet. Preview your project to see output.</p>
        ) : (
          logs.map((log, index) => (
            <div
              key={index}
              className={`py-1 px-2 border-l-2 ${getLogLevelClass(log.level)} mb-1 whitespace-pre-wrap break-words`}
            >
              <span className="text-gray-400 dark:text-gray-500 mr-2">{log.timestamp}</span>
              <span className={log.level === 'error' ? 'font-bold' : ''}>
                {formatMessage(log.message)}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Console;