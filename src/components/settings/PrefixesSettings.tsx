import { useState } from 'react';
import { usePrefixStore } from '../../store/usePrefixStore';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

const PrefixesSettings = () => {
  const { issuePrefixes, epicPrefixes, addIssuePrefix, addEpicPrefix, removeIssuePrefix, removeEpicPrefix } =
    usePrefixStore();
  const [issueInput, setIssueInput] = useState('');
  const [epicInput, setEpicInput] = useState('');

  const handleAddIssuePrefix = () => {
    const val = issueInput.trim();
    if (!val) return;
    addIssuePrefix(val);
    setIssueInput('');
  };

  const handleAddEpicPrefix = () => {
    const input = epicInput.trim();
    if (!input) return;
    const prefixes = input
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);
    prefixes.forEach((prefix) => {
      addEpicPrefix(prefix);
    });
    setEpicInput('');
  };

  const handleKeyPress = (type: 'issue' | 'epic') => (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (type === 'issue') {
        handleAddIssuePrefix();
      } else {
        handleAddEpicPrefix();
      }
    }
  };

  return (
    <div className="max-w-2xl space-y-8">
      <h2 className="text-xl font-semibold mb-4">Prefixes</h2>

      <div className="space-y-4">
        <div>
          <Label className="mb-2 block">Issue Prefixes</Label>
          {issuePrefixes.length > 0 && (
            <ul className="mb-4 border border-app-border-primary rounded-md divide-y divide-app-border-secondary">
              {issuePrefixes.map((p) => (
                <li key={p} className="flex items-center justify-between px-3 py-2">
                  <span>{p}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label="Delete issue prefix"
                    onClick={() => removeIssuePrefix(p)}
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
              value={issueInput}
              onChange={(e) => setIssueInput(e.target.value)}
              onKeyDown={handleKeyPress('issue')}
              placeholder="Add issue prefixes (e.g., bug, feat, fix)"
              className="flex-1"
            />
            <Button onClick={handleAddIssuePrefix} variant="primary" disabled={!issueInput.trim()}>
              Add
            </Button>
          </div>
        </div>

        <div>
          <Label className="mb-2 block">Epic Prefixes</Label>
          {epicPrefixes.length > 0 && (
            <ul className="mb-4 border border-app-border-primary rounded-md divide-y divide-app-border-secondary">
              {epicPrefixes.map((p) => (
                <li key={p} className="flex items-center justify-between px-3 py-2">
                  <span>{p}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label="Delete epic prefix"
                    onClick={() => removeEpicPrefix(p)}
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
              value={epicInput}
              onChange={(e) => setEpicInput(e.target.value)}
              onKeyDown={handleKeyPress('epic')}
              placeholder="Add epic prefixes (e.g., epic, milestone)"
              className="flex-1"
            />
            <Button onClick={handleAddEpicPrefix} variant="primary" disabled={!epicInput.trim()}>
              Add
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrefixesSettings;
