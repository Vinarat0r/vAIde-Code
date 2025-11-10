import React, { useRef } from 'react';
import { ImageFile, GeneratedFile } from '../types';
import { SparklesIcon, ImageIcon, CloseIcon, ErrorIcon, WandIcon, FolderIcon } from './icons';

interface PromptControlsProps {
  prompt: string;
  setPrompt: (prompt: string) => void;
  imageFile: ImageFile | null;
  setImageFile: (file: ImageFile | null) => void;
  contextFiles: GeneratedFile[];
  setContextFiles: (files: GeneratedFile[] | ((prev: GeneratedFile[]) => GeneratedFile[])) => void;
  onGenerate: () => void;
  isLoading: boolean;
  onEnhance: () => void;
  isEnhancing: boolean;
  error: string | null;
  setError: (error: string | null) => void;
}

const fileToBase64 = (file: File): Promise<{ base64: string; mimeType: string }> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const [mimeType, base64] = result.split(';base64,');
      resolve({ base64, mimeType: mimeType.replace('data:', '') });
    };
    reader.onerror = (error) => reject(error);
  });


const PromptControls: React.FC<PromptControlsProps> = ({
  prompt,
  setPrompt,
  imageFile,
  setImageFile,
  contextFiles,
  setContextFiles,
  onGenerate,
  isLoading,
  onEnhance,
  isEnhancing,
  error,
  setError
}) => {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const contextFilesInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const { base64, mimeType } = await fileToBase64(file);
        setImageFile({ base64, mimeType, name: file.name });
      } catch (err) {
        setError('Failed to read image file.');
      }
    }
  };
  
  const handleRemoveImage = () => {
    setImageFile(null);
    if(imageInputRef.current) {
        imageInputRef.current.value = "";
    }
  }

  const handleContextFilesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles: GeneratedFile[] = [];
    for (const file of Array.from(files)) {
      try {
        const code = await file.text();
        const language = file.name.split('.').pop() || '';
        newFiles.push({ fileName: file.name, code, language });
      } catch (err) {
        setError(`Failed to read file: ${file.name}`);
      }
    }
    setContextFiles(prev => [...prev, ...newFiles]);

    if (contextFilesInputRef.current) {
        contextFilesInputRef.current.value = "";
    }
  };

  const handleRemoveContextFile = (index: number) => {
    setContextFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="shrink-0 p-4 rounded-lg bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark shadow-md flex flex-col gap-3">
       {error && (
        <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 px-4 py-2 rounded-md relative flex items-center" role="alert">
          <ErrorIcon className="w-5 h-5 mr-2"/>
          <span className="block sm:inline">{error}</span>
          <button onClick={() => setError(null)} className="absolute top-0 bottom-0 right-0 px-4 py-2">
            <CloseIcon className="w-4 h-4"/>
          </button>
        </div>
      )}
      <div className="relative">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe your component or webpage... e.g., 'A modern login form with a cat logo'"
          className="w-full h-24 p-2 pr-24 border rounded-md resize-none bg-background-light dark:bg-background-dark border-border-light dark:border-border-dark focus:ring-2 focus:ring-primary-light dark:focus:ring-primary-dark focus:outline-none"
          disabled={isLoading || isEnhancing}
        />
        <input
          type="file"
          accept="image/*"
          ref={imageInputRef}
          onChange={handleImageUpload}
          className="hidden"
        />
         <input
          type="file"
          ref={contextFilesInputRef}
          onChange={handleContextFilesUpload}
          className="hidden"
          multiple
        />
        <div className="absolute top-2 right-2 flex gap-1">
            <button
              onClick={() => contextFilesInputRef.current?.click()}
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              title="Add context files"
              disabled={isLoading || isEnhancing}
            >
              <FolderIcon className="w-5 h-5 text-text-secondary-light dark:text-text-secondary-dark" />
            </button>
            <button
              onClick={() => imageInputRef.current?.click()}
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              title="Attach an image"
              disabled={isLoading || isEnhancing}
            >
              <ImageIcon className="w-5 h-5 text-text-secondary-light dark:text-text-secondary-dark" />
            </button>
        </div>
      </div>
      
      {imageFile && (
        <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-700 p-2 rounded-md text-sm">
          <span className="truncate text-text-secondary-light dark:text-text-secondary-dark">{imageFile.name}</span>
          <button onClick={handleRemoveImage} disabled={isLoading || isEnhancing} className="p-1 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600">
            <CloseIcon className="w-4 h-4"/>
          </button>
        </div>
      )}

      {contextFiles.length > 0 && (
        <div className="flex flex-col gap-2 bg-gray-100 dark:bg-gray-700 p-2 rounded-md">
            <h4 className="text-xs font-semibold text-text-secondary-light dark:text-text-secondary-dark">Context Files:</h4>
            <ul className="max-h-24 overflow-y-auto space-y-1 pr-1">
                {contextFiles.map((file, index) => (
                    <li key={`${file.fileName}-${index}`} className="flex items-center justify-between text-sm">
                        <span className="truncate text-text-secondary-light dark:text-text-secondary-dark text-xs">{file.fileName}</span>
                        <button onClick={() => handleRemoveContextFile(index)} disabled={isLoading || isEnhancing} className="p-1 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 shrink-0 ml-2">
                            <CloseIcon className="w-3 h-3"/>
                        </button>
                    </li>
                ))}
            </ul>
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          onClick={onEnhance}
          disabled={isLoading || isEnhancing || !prompt.trim()}
          className="flex items-center justify-center gap-2 px-4 py-2 font-semibold rounded-md transition-colors bg-secondary-light hover:bg-emerald-600 dark:bg-secondary-dark dark:hover:bg-emerald-500 text-white disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
          title="Enhance prompt with AI"
        >
          {isEnhancing ? (
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <WandIcon className="w-5 h-5" />
          )}
          Enhance
        </button>
        <button
          onClick={onGenerate}
          disabled={isLoading || isEnhancing || !prompt.trim()}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-white font-semibold rounded-md transition-colors bg-primary-light hover:bg-indigo-700 dark:bg-primary-dark dark:hover:bg-indigo-500 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating...
            </>
          ) : (
            <>
              <SparklesIcon className="w-5 h-5" />
              Generate
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default PromptControls;