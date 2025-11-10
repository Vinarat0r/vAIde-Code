import React, { useState } from 'react';
import { SearchIcon, CloseIcon } from './icons';

interface SearchSourcesProps {
  metadata: any;
}

const SearchSources: React.FC<SearchSourcesProps> = ({ metadata }) => {
  const [isOpen, setIsOpen] = useState(false);

  const chunks = metadata?.groundingChunks?.filter(
      (chunk: any) => chunk.web && chunk.web.uri && chunk.web.title
  ) || [];

  if (chunks.length === 0) {
    return null;
  }

  if (!isOpen) {
    return (
      <div className="flex justify-end p-2 shrink-0">
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-3 py-1 text-xs font-semibold rounded-md transition-colors bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark hover:bg-gray-200 dark:hover:bg-gray-700 text-text-secondary-light dark:text-text-secondary-dark"
          title="Show web sources used for generation"
        >
          <SearchIcon className="w-4 h-4" />
          Web Sources ({chunks.length})
        </button>
      </div>
    );
  }

  return (
    <div className="shrink-0 p-4 rounded-lg bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark shadow-md flex flex-col gap-3 relative">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2 text-text-primary-light dark:text-text-primary-dark">
          <SearchIcon className="w-4 h-4" />
          Web Sources
        </h3>
        <button
          onClick={() => setIsOpen(false)}
          className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
          title="Close sources"
        >
          <CloseIcon className="w-4 h-4" />
        </button>
      </div>
      <ul className="list-disc list-inside space-y-1 text-xs max-h-32 overflow-y-auto pr-2">
        {chunks.map((chunk: any, index: number) => (
            <li key={index}>
                <a
                    href={chunk.web.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-light dark:text-primary-dark hover:underline truncate block"
                    title={chunk.web.uri}
                >
                    {chunk.web.title}
                </a>
            </li>
        ))}
      </ul>
    </div>
  );
};

export default SearchSources;