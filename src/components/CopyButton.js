import { MdContentCopy } from 'react-icons/md';
import useContentCopy from '../hooks/useContentCopy';

const CopyButton = ({ text, title = "Copiar", size = 16, style = {} }) => {
  const { handleCopy } = useContentCopy();

  return (
    <button
      type="button"
      onClick={() => handleCopy(text)}
      style={{
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        ...style
      }}
      title={title}
      aria-label={title}
    >
      <MdContentCopy size={size} />
    </button>
  );
};

export default CopyButton;
