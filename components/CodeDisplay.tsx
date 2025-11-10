import React, { useMemo, useState, useEffect } from 'react';
import { GeneratedFile } from '../types';
import { downloadFile, downloadZip } from '../utils/fileUtils';
import { DownloadIcon, ZipIcon, CopyIcon, CheckIcon } from './icons';
import CodeEditor from './CodeEditor';

interface CodeDisplayProps {
  files: GeneratedFile[];
  activeFileName: string | null;
  setActiveFileName: (name: string) => void;
  onFileChange: (fileName: string, newCode: string) => void;
}

const CodeDisplay: React.FC<CodeDisplayProps> = ({ files, activeFileName, setActiveFileName, onFileChange }) => {
  const activeFile = useMemo(() => files.find(f => f.fileName === activeFileName), [files, activeFileName]);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    // Reset copy status when the active file changes
    setIsCopied(false);
  }, [activeFileName]);

  const handleCopy = () => {
    if (!activeFile) return;
    navigator.clipboard.writeText(activeFile.code).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000); // Reset after 2 seconds
    }, (err) => {
      console.error('Failed to copy text: ', err);
      // You could add user feedback for copy failure here
    });
  };

  return (
    <div className="flex flex-col h-full bg-surface-light dark:bg-surface-dark rounded-lg">
      <div className="flex items-center justify-between border-b border-border-light dark:border-border-dark p-2">
        <div className="flex items-center gap-1 overflow-x-auto">
          {files.map(file => (
            <button
              key={file.fileName}
              onClick={() => setActiveFileName(file.fileName)}
              className={`px-3 py-1 text-sm rounded-md transition-colors whitespace-nowrap ${
                activeFileName === file.fileName
                  ? 'bg-primary-light/10 text-primary-light dark:bg-primary-dark/20 dark:text-primary-dark font-semibold'
                  : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-text-secondary-light dark:text-text-secondary-dark'
              }`}
            >
              {file.fileName}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 pl-2">
            <button
              onClick={handleCopy}
              disabled={!activeFile}
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 disabled:opacity-50"
              title="Copy code"
            >
              {isCopied ? (
                <CheckIcon className="w-5 h-5 text-green-500" />
              ) : (
                <CopyIcon className="w-5 h-5 text-text-secondary-light dark:text-text-secondary-dark" />
              )}
            </button>
            {activeFile && (
                 <button 
                    onClick={() => downloadFile(activeFile)}
                    className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    title={`Download ${activeFile.fileName}`}
                >
                    <DownloadIcon className="w-5 h-5 text-text-secondary-light dark:text-text-secondary-dark"/>
                </button>
            )}
             <button 
                onClick={() => downloadZip(files)}
                className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                title="Download Project as ZIP"
            >
                <ZipIcon className="w-5 h-5 text-text-secondary-light dark:text-text-secondary-dark"/>
            </button>
        </div>
      </div>
      <div className="flex-grow overflow-hidden">
        {activeFile ? (
          <CodeEditor
            key={activeFile.fileName}
            code={activeFile.code}
            onChange={(newCode) => onFileChange(activeFile.fileName, newCode)}
          />
        ) : (
          <div className="p-4 text-text-secondary-light dark:text-text-secondary-dark">
            Select a file to view its content.
          </div>
        )}
      </div>
    </div>
  );
};

export default CodeDisplay;
