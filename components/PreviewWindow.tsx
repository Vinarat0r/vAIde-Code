import React from 'react';
import { ExternalLinkIcon, PanelOpenIcon, PanelCloseIcon, RefreshIcon } from './icons';

interface PreviewWindowProps {
  content: string;
  isLoading: boolean;
  isConsoleVisible: boolean;
  toggleConsole: () => void;
  onUpdate: () => void;
  previewKey: number;
}

const PreviewWindow: React.FC<PreviewWindowProps> = ({ content, isLoading, isConsoleVisible, toggleConsole, onUpdate, previewKey }) => {
  const openInNewTab = () => {
    if (!content) return;
    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full bg-surface-light dark:bg-surface-dark rounded-lg border border-border-light dark:border-border-dark shadow-md overflow-hidden">
      <div className="flex items-center justify-between p-2 border-b border-border-light dark:border-border-dark">
        <h2 className="text-sm font-semibold text-text-primary-light dark:text-text-primary-dark">Live Preview</h2>
        <div className="flex items-center gap-2">
            <button
                onClick={onUpdate}
                className="flex items-center gap-1 px-2 py-1 text-xs rounded-md transition-colors bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 disabled:opacity-50"
                title="Refresh Preview"
                disabled={isLoading}
            >
                <RefreshIcon className="w-3 h-3"/>
                Refresh
            </button>
            <button
                onClick={toggleConsole}
                className="flex items-center gap-1 px-2 py-1 text-xs rounded-md transition-colors bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
                title={isConsoleVisible ? 'Hide Console' : 'Show Console'}
            >
                {isConsoleVisible ? <PanelCloseIcon className="w-3 h-3"/> : <PanelOpenIcon className="w-3 h-3"/>}
                Console
            </button>
            <button
              onClick={openInNewTab}
              disabled={!content || isLoading}
              className="flex items-center gap-1 px-2 py-1 text-xs rounded-md transition-colors bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Open preview in a new tab"
            >
              <ExternalLinkIcon className="w-3 h-3" />
              New Tab
            </button>
        </div>
      </div>
      <div className="flex-grow relative bg-white">
        {isLoading ? (
          <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-800 text-text-secondary-light dark:text-text-secondary-dark">
            <svg className="animate-spin h-8 w-8 text-primary-light dark:text-primary-dark" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : (
          <iframe
            key={previewKey}
            srcDoc={content}
            title="Live Preview"
            className="w-full h-full border-0"
            sandbox="allow-scripts allow-same-origin"
          />
        )}
      </div>
    </div>
  );
};

export default PreviewWindow;