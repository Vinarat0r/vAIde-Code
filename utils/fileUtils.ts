
import { GeneratedFile } from '../types';

declare const JSZip: any;

export const downloadFile = (file: GeneratedFile): void => {
  const blob = new Blob([file.code], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const downloadZip = async (files: GeneratedFile[], projectName: string = 'vibe-coder-project'): Promise<void> => {
  if (typeof JSZip === 'undefined') {
    alert('JSZip library is not loaded. Cannot create ZIP file.');
    return;
  }

  const zip = new JSZip();
  files.forEach(file => {
    zip.file(file.fileName, file.code);
  });

  const content = await zip.generateAsync({ type: 'blob' });
  
  const url = URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${projectName}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
