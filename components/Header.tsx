import React from 'react';
import { Theme, Model, ProjectType } from '../types';
import { SunIcon, MoonIcon, CodeIcon, SearchIcon } from './icons';

interface HeaderProps {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  selectedModel: Model;
  setSelectedModel: (model: Model) => void;
  projectType: ProjectType;
  setProjectType: (type: ProjectType) => void;
  isSearchEnabled: boolean;
  setIsSearchEnabled: (enabled: boolean) => void;
  isLoading: boolean;
}

const Header: React.FC<HeaderProps> = ({
  theme,
  setTheme,
  selectedModel,
  setSelectedModel,
  projectType,
  setProjectType,
  isSearchEnabled,
  setIsSearchEnabled,
  isLoading
}) => {
  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <header className="flex items-center justify-between p-3 border-b border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark shadow-sm shrink-0">
      <div className="flex items-center gap-3">
        <CodeIcon className="w-8 h-8 text-primary-light dark:text-primary-dark" />
        <h1 className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark">vAIde Code</h1>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
            <label htmlFor="projectType" className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">Project:</label>
            <select
              id="projectType"
              value={projectType}
              onChange={(e) => setProjectType(e.target.value as ProjectType)}
              disabled={isLoading}
              className="bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-primary-light dark:focus:ring-primary-dark focus:outline-none"
            >
              <option value="html-css-js">HTML/CSS/JS (Simple)</option>
              <option value="html-css-js-complex">HTML/CSS/JS (Complex)</option>
            </select>
        </div>
        <div className="flex items-center gap-2">
            <label htmlFor="model" className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">Model:</label>
            <select
              id="model"
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value as Model)}
              disabled={isLoading}
              className="bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-primary-light dark:focus:ring-primary-dark focus:outline-none"
            >
              <option value="gemini-flash-lite-latest">Flash Lite</option>
              <option value="gemini-flash-latest">Flash</option>
              <option value="gemini-2.5-pro">Pro 2.5</option>
            </select>
        </div>
        <div className="flex items-center gap-2">
           <label htmlFor="search-toggle" className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark flex items-center gap-1">
                <SearchIcon className="w-4 h-4" /> Web Search
            </label>
            <button
                id="search-toggle"
                onClick={() => setIsSearchEnabled(!isSearchEnabled)}
                disabled={isLoading}
                className={`${
                isSearchEnabled ? 'bg-primary-light dark:bg-primary-dark' : 'bg-gray-200 dark:bg-gray-600'
                } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-light dark:focus:ring-primary-dark focus:ring-offset-2 dark:focus:ring-offset-background-dark`}
                role="switch"
                aria-checked={isSearchEnabled}
            >
                <span
                className={`${
                    isSearchEnabled ? 'translate-x-5' : 'translate-x-0'
                } inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                />
            </button>
        </div>
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'light' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
        </button>
      </div>
    </header>
  );
};

export default Header;