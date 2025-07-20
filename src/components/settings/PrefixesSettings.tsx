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
        <ul className="mb-4 border rounded-md divide-y divide-gray-300 dark:divide-gray-700">
          {prefixes.map(p => (
            <li key={p} className="flex items-center justify-between px-3 py-2">
              <span>{p}</span>
              <button
                aria-label="Delete"
                onClick={() => removePrefix(p)}
                className="text-red-600 hover:text-red-800"
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
          className="flex-1 border border-gray-300 dark:border-gray-700 rounded-md p-2 bg-white dark:bg-gray-800"
        />
        <button
          onClick={handleAdd}
          className="px-3 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50"
          disabled={!input.trim()}
        >
          Add
        </button>
      </div>
    </div>
  );
};

export default PrefixesSettings;
