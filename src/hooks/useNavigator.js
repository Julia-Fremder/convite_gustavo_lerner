const useNavigator = () => {
    const [copyStatus, setCopyStatus] = useState({ message: '', isError: false });
      const handleCopy = useCallback(async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus({ message: 'Copiado!', isError: false });
      setTimeout(() => setCopyStatus({ message: '', isError: false }), 2000);
    } catch (_error) {
      setCopyStatus({ message: 'Erro ao copiar', isError: true });
      setTimeout(() => setCopyStatus({ message: '', isError: false }), 2000);
    }
  }, []);
    return { handleCopy, copyStatus };
}