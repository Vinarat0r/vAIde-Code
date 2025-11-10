import React, { useState, useEffect, useCallback } from 'react';
import { Theme, Model, ProjectType, GeneratedFile, ImageFile, LogEntry } from './types';
import { generateCode, fixCode, enhancePrompt } from './services/geminiService';
import Header from './components/Header';
import PromptControls from './components/PromptControls';
import CodeDisplay from './components/CodeDisplay';
import PreviewWindow from './components/PreviewWindow';
import Console from './components/Console';
import { WelcomeIcon } from './components/icons';
import SearchSources from './components/SearchSources';

declare const Babel: any;

const App: React.FC = () => {
  const [theme, setTheme] = useState<Theme>('dark');
  const [selectedModel, setSelectedModel] = useState<Model>('gemini-flash-latest');
  const [projectType, setProjectType] = useState<ProjectType>('html-css-js');
  const [isSearchEnabled, setIsSearchEnabled] = useState<boolean>(true);
  const [prompt, setPrompt] = useState<string>('');
  const [imageFile, setImageFile] = useState<ImageFile | null>(null);
  const [contextFiles, setContextFiles] = useState<GeneratedFile[]>([]);
  const [generatedFiles, setGeneratedFiles] = useState<GeneratedFile[]>([]);
  const [activeFileName, setActiveFileName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isEnhancing, setIsEnhancing] = useState<boolean>(false);
  const [isFixingCode, setIsFixingCode] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [groundingMetadata, setGroundingMetadata] = useState<any | null>(null);
  const [previewContent, setPreviewContent] = useState<string>('');
  const [previewKey, setPreviewKey] = useState<number>(0);
  const [isPreviewLoading, setIsPreviewLoading] = useState<boolean>(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isConsoleVisible, setIsConsoleVisible] = useState<boolean>(true);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove(theme === 'light' ? 'dark' : 'light');
    root.classList.add(theme);
  }, [theme]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.source === 'vibe-coder-iframe-log') {
        const { level, message } = event.data.payload;
        setLogs(prevLogs => [
          ...prevLogs,
          { level, message, timestamp: new Date().toLocaleTimeString() }
        ]);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);
  
  const handleFileChange = (fileName: string, newCode: string) => {
    setGeneratedFiles(prevFiles =>
        prevFiles.map(file =>
            file.fileName === fileName ? { ...file, code: newCode } : file
        )
    );
  };

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setGeneratedFiles([]);
    setActiveFileName(null);
    setGroundingMetadata(null);
    setPreviewContent('');
    setLogs([]);
    
    try {
      const { files, groundingMetadata } = await generateCode(prompt, imageFile, contextFiles, selectedModel, projectType, isSearchEnabled);
      setGeneratedFiles(files);
      setGroundingMetadata(groundingMetadata);
      if (files.length > 0) {
        setActiveFileName(files[0].fileName);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [prompt, imageFile, contextFiles, selectedModel, projectType, isSearchEnabled]);

  const handleEnhancePrompt = useCallback(async () => {
    if (!prompt.trim()) return;
    setIsEnhancing(true);
    setError(null);
    try {
        const enhanced = await enhancePrompt(prompt);
        setPrompt(enhanced);
    } catch (err) {
        const message = err instanceof Error ? err.message : 'An unknown error occurred during enhancement.';
        setError(`Prompt Enhance Failed: ${message}`);
        console.error(err);
    } finally {
        setIsEnhancing(false);
    }
  }, [prompt]);

  const handleFixCode = useCallback(async () => {
    if (generatedFiles.length === 0 || logs.filter(l => l.level === 'error').length === 0) {
      return;
    }
    setIsFixingCode(true);
    setError(null);
    
    try {
      const { files } = await fixCode(generatedFiles, logs, selectedModel, projectType);
      setGeneratedFiles(files);
      // Keep the active file if it still exists, otherwise reset
      if (!files.some(f => f.fileName === activeFileName)) {
          setActiveFileName(files.length > 0 ? files[0].fileName : null);
      }
      setLogs([]); // Clear logs after a successful fix
    } catch (err) {
      setError(err instanceof Error ? `AI Fix Failed: ${err.message}` : 'An unknown error occurred during the fix.');
      console.error(err);
    } finally {
      setIsFixingCode(false);
    }
  }, [generatedFiles, logs, selectedModel, projectType, activeFileName]);

  const updatePreview = useCallback(() => {
    if (generatedFiles.length === 0) {
      setPreviewContent('');
      setPreviewKey(k => k + 1);
      return;
    }

    setIsPreviewLoading(true);

    const consoleLoggerScript = `
      <script>
        const originalConsole = { ...window.console };
        const postLog = (level, args) => {
          const serializedMessage = args.map(arg => {
            if (arg instanceof Error) {
              return arg.stack || arg.message;
            }
            try {
              // Attempt to stringify for better object inspection, fallback to String
              return typeof arg === 'object' && arg !== null ? JSON.stringify(arg) : String(arg);
            } catch (e) {
              return String(arg);
            }
          }).join(' ');

          window.parent.postMessage({
            source: 'vibe-coder-iframe-log',
            payload: { level, message: serializedMessage }
          }, '*');
        };

        window.console.log = (...args) => { originalConsole.log(...args); postLog('log', args); };
        window.console.warn = (...args) => { originalConsole.warn(...args); postLog('warn', args); };
        window.console.error = (...args) => { originalConsole.error(...args); postLog('error', args); };
        window.console.info = (...args) => { originalConsole.info(...args); postLog('info', args); };
        
        window.onerror = (message, source, lineno, colno, error) => {
          postLog('error', [message, error]);
          originalConsole.error(message, source, lineno, colno, error);
          return true;
        };

        window.addEventListener('unhandledrejection', event => {
          postLog('error', ['Unhandled promise rejection:', event.reason]);
          originalConsole.warn('Unhandled promise rejection:', event.reason);
        });
      <\/script>
    `;

    if (projectType === 'html-css-js' || projectType === 'html-css-js-complex') {
      const htmlFile = generatedFiles.find(f => f.language === 'html');
      if (!htmlFile) {
        setPreviewContent('<!-- No HTML file found -->');
        setPreviewKey(k => k + 1);
        setIsPreviewLoading(false);
        return;
      }

      let htmlContent = htmlFile.code;
      const cssFiles = generatedFiles.filter(f => f.language === 'css');
      const cssLinks = cssFiles.map(f => `<style>${f.code}</style>`).join('\n');
      
      const jsFiles = generatedFiles.filter(f => f.language === 'javascript');
      const jsScripts = jsFiles.map(f => `<script>${f.code}<\/script>`).join('\n');

      htmlContent = htmlContent.replace('</head>', `${cssLinks}</head>`);
      htmlContent = htmlContent.replace('</body>', `${jsScripts}</body>`);
      htmlContent = htmlContent.replace('<head>', `<head>${consoleLoggerScript}`);
      setPreviewContent(htmlContent);
    } else if (projectType === 'react') {
      try {
        const tsxFiles = generatedFiles.filter(f => f.fileName.endsWith('.tsx'));
        const cssFiles = generatedFiles.filter(f => f.fileName.endsWith('.css'));

        if (tsxFiles.length === 0) {
          throw new Error("No .tsx files found for React preview.");
        }

        const combinedTsx = tsxFiles.map(f => f.code).join('\n\n');
        const combinedCss = cssFiles.map(f => f.code).join('\n\n');
        
        const transpiledCode = Babel.transform(combinedTsx, {
          presets: ['react', 'typescript'],
          filename: 'app.tsx'
        }).code;

        const reactHtml = `
          <html>
            <head>
              <style>${combinedCss}</style>
              ${consoleLoggerScript}
              <script src="https://unpkg.com/react@18/umd/react.development.js"><\/script>
              <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"><\/script>
            </head>
            <body>
              <div id="root"></div>
              <script>
                try {
                  ${transpiledCode}
                } catch (e) {
                  console.error(e);
                }
              <\/script>
            </body>
          </html>
        `;
        setPreviewContent(reactHtml);
      } catch (e) {
        console.error("React preview transpilation failed:", e);
        const errorMessage = e instanceof Error ? e.message : String(e);
        setLogs(prev => [...prev, { level: 'error', message: `Babel Transpilation Failed: ${errorMessage}`, timestamp: new Date().toLocaleTimeString() }]);
        setPreviewContent(`<div style="font-family: sans-serif; padding: 1rem; color: #ef4444;">
          <h2>React Preview Error</h2>
          <p>Could not generate a live preview. Check the console for details.</p>
          <pre style="white-space: pre-wrap; background: #fef2f2; padding: 1rem; border-radius: 4px;">${errorMessage}</pre>
        </div>`);
      }
    }
    setPreviewKey(k => k + 1);
    setIsPreviewLoading(false);
  }, [generatedFiles, projectType]);
  
  useEffect(() => {
    updatePreview();
  }, [updatePreview]);

  return (
    <div className="flex flex-col h-screen font-sans bg-background-light dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark overflow-hidden">
      <Header
        theme={theme}
        setTheme={setTheme}
        selectedModel={selectedModel}
        setSelectedModel={setSelectedModel}
        projectType={projectType}
        setProjectType={setProjectType}
        isSearchEnabled={isSearchEnabled}
        setIsSearchEnabled={setIsSearchEnabled}
        isLoading={isLoading || isFixingCode || isEnhancing}
      />
      <main className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4 p-4 overflow-hidden">
        <div className="flex flex-col gap-4 overflow-y-auto">
          <PromptControls
            prompt={prompt}
            setPrompt={setPrompt}
            imageFile={imageFile}
            setImageFile={setImageFile}
            contextFiles={contextFiles}
            setContextFiles={setContextFiles}
            onGenerate={handleGenerate}
            isLoading={isLoading}
            isEnhancing={isEnhancing}
            onEnhance={handleEnhancePrompt}
            error={error}
            setError={setError}
          />
          <div className="flex-grow overflow-hidden rounded-lg bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark shadow-md min-h-0">
            {generatedFiles.length > 0 ? (
              <CodeDisplay
                files={generatedFiles}
                activeFileName={activeFileName}
                setActiveFileName={setActiveFileName}
                onFileChange={handleFileChange}
              />
            ) : (
               <div className="flex flex-col items-center justify-center h-full text-text-secondary-light dark:text-text-secondary-dark p-8 text-center">
                  <WelcomeIcon className="w-24 h-24 mb-4 text-primary-light dark:text-primary-dark opacity-50" />
                  <h2 className="text-2xl font-semibold mb-2 text-text-primary-light dark:text-text-primary-dark">Welcome to vAIde Code</h2>
                  <p>Describe your vision, add an image for inspiration, and watch your project come to life. Your generated code will appear here.</p>
              </div>
            )}
          </div>
          {groundingMetadata && groundingMetadata.groundingChunks?.length > 0 && (
            <SearchSources metadata={groundingMetadata} />
          )}
        </div>
        <div className="flex flex-col gap-4 overflow-hidden">
          <div className={isConsoleVisible ? "h-2/3" : "h-full"}>
             <PreviewWindow 
                content={previewContent}
                isLoading={isPreviewLoading}
                isConsoleVisible={isConsoleVisible}
                toggleConsole={() => setIsConsoleVisible(v => !v)}
                onUpdate={updatePreview}
                previewKey={previewKey}
              />
          </div>
          {isConsoleVisible && (
            <div className="h-1/3">
              <Console 
                logs={logs} 
                onClear={() => setLogs([])}
                onFixCode={handleFixCode}
                isFixing={isFixingCode}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;