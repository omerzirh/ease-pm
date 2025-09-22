import { useState } from 'react';
import { usePrefixStore } from '../../store/usePrefixStore';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

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
          {prefixes.map((p) => (
            <li key={p} className="flex items-center justify-between px-3 py-2">
              <span>{p}</span>
              <Button
                variant="ghost"
                size="sm"
                aria-label="Delete"
                onClick={() => removePrefix(p)}
                className="text-destructive hover:text-destructive/80"
              >
                &times;
              </Button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="new prefix"
          className="flex-1"
        />
        <Button onClick={handleAdd} variant="primary" disabled={!input.trim()}>
          Add
        </Button>
      </div>
    </div>
  );
};

export default PrefixesSettings;
