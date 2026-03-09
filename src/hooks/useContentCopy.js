import { useState, useCallback } from 'react';

const useContentCopy = () => {
  const [copyStatus, setCopyStatus] = useState({ message: '', isError: false });

  const fallbackCopy = (text) => {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.setAttribute('readonly', '');
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    textArea.style.pointerEvents = 'none';
    document.body.appendChild(textArea);
    textArea.select();
    textArea.setSelectionRange(0, text.length);
    const copied = document.execCommand('copy');
    document.body.removeChild(textArea);
    return copied;
  };

  const handleCopy = useCallback(async (text) => {
    try {
      if (!text && text !== 0) {
        throw new Error('Texto vazio para copiar');
      }

      const stringText = String(text);
      const hasClipboardApi = !!navigator?.clipboard?.writeText;

      if (hasClipboardApi) {
        await navigator.clipboard.writeText(stringText);
      } else {
        const copied = fallbackCopy(stringText);
        if (!copied) {
          throw new Error('Falha no fallback de cópia');
        }
      }

      setCopyStatus({ message: 'Copiado!', isError: false });
      window.setTimeout(() => setCopyStatus({ message: '', isError: false }), 2000);
    } catch (_error) {
      setCopyStatus({ message: 'Erro ao copiar', isError: true });
      window.setTimeout(() => setCopyStatus({ message: '', isError: false }), 2000);
    }
  }, []);

  return { handleCopy, copyStatus };
};

export default useContentCopy;
