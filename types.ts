export type Theme = 'light' | 'dark';

export type Model = 'gemini-flash-lite-latest' | 'gemini-flash-latest' | 'gemini-2.5-pro';

export type ProjectType = 'html-css-js' | 'html-css-js-complex' | 'react';

export interface GeneratedFile {
  fileName: string;
  language: string;
  code: string;
}

export interface ImageFile {
  base64: string;
  mimeType: string;
  name: string;
}

export interface GenerationResult {
  files: GeneratedFile[];
  groundingMetadata: any | null;
}

export interface LogEntry {
  level: string;
  message: any;
  timestamp: string;
}