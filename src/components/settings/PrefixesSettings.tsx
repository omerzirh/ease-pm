import { useState } from 'react';
import { usePrefixStore } from '../../store/usePrefixStore';

const PrefixesSettings = () => {
  const { prefixes, addPrefix, removePrefix } = usePrefixStore();
  const [input, setInput] = useState('');

  const handleAdd = () => {
    const val = input.trim();
    if (!val) return;
    addPrefix(val);
    setInput('');
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAdd();
    }
  };

  return (
    <div className="max-w-md">
      <h2 className="text-xl font-semibold mb-4">Prefixes</h2>

      {prefixes.length > 0 && (
        <ul className="mb-4 border border-app-border-primary rounded-md divide-y divide-app-border-secondary">
          {prefixes.map(p => (
            <li key={p} className="flex items-center justify-between px-3 py-2">
              <span>{p}</span>
              <button
                aria-label="Delete"
                onClick={() => removePrefix(p)}
                className="text-app-semantic-error hover:opacity-80"
              >
                &times;
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="new prefix"
          className="flex-1 border border-app-border-primary focus:border-app-border-focus focus:ring-2 focus:ring-app-border-focus rounded-md p-2 bg-app-surface-primary text-app-text-primary placeholder:text-app-text-tertiary transition-colors"
        />
        <button
          onClick={handleAdd}
          className="px-3 py-2 bg-app-interactive-primary hover:bg-app-interactive-primary-hover text-app-text-inverse rounded-md disabled:bg-app-interactive-disabled disabled:opacity-50 transition-colors"
          disabled={!input.trim()}
        >
          Add
        </button>
      </div>
    </div>
  );
};

export default PrefixesSettings;
