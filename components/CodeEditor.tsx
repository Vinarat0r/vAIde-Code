import React, { useState, useRef, useEffect, useCallback } from 'react';

interface CodeEditorProps {
  code: string;
  onChange: (newCode: string) => void;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ code, onChange }) => {
  const [lineNumbers, setLineNumbers] = useState('');
  const lineNumbersRef = useRef<HTMLTextAreaElement>(null);
  const codeRef = useRef<HTMLTextAreaElement>(null);

  const updateLineNumbers = useCallback((text: string) => {
    const lineCount = text.split('\n').length;
    setLineNumbers(Array.from({ length: lineCount }, (_, i) => i + 1).join('\n'));
  }, []);

  const syncScroll = useCallback(() => {
    if (lineNumbersRef.current && codeRef.current) {
      lineNumbersRef.current.scrollTop = codeRef.current.scrollTop;
    }
  }, []);


  useEffect(() => {
    updateLineNumbers(code);
    // Ensure scroll is synced on initial render
    setTimeout(syncScroll, 0); 
  }, [code, updateLineNumbers, syncScroll]);

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newCode = e.target.value;
    onChange(newCode);
    updateLineNumbers(newCode);
  };

  const commonClasses = "p-4 font-mono text-sm leading-normal border-0 resize-none outline-none bg-surface-light dark:bg-surface-dark";

  return (
    <div className="flex h-full bg-surface-light dark:bg-surface-dark rounded-b-lg overflow-hidden">
      <div className="w-12 h-full overflow-hidden">
        <textarea
            ref={lineNumbersRef}
            className={`${commonClasses} h-full text-right text-gray-400 dark:text-gray-500 select-none whitespace-pre`}
            style={{ width: 'calc(3rem + 17px)' }} // 3rem (w-12) + 17px for scrollbar
            value={lineNumbers}
            readOnly
            aria-hidden="true"
            tabIndex={-1}
            wrap="off"
        />
      </div>
      <textarea
        ref={codeRef}
        className={`${commonClasses} flex-grow text-text-primary-light dark:text-text-primary-dark whitespace-pre`}
        value={code}
        onChange={handleCodeChange}
        onScroll={syncScroll}
        spellCheck="false"
        autoCapitalize="off"
        autoComplete="off"
        autoCorrect="off"
        wrap="off"
      />
    </div>
  );
};

export default CodeEditor;
