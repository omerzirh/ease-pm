import { useState, useEffect, useMemo } from 'react';
import gitlabService from '../services/gitlabService';
import { useLabelStore } from '../store/useLabelStore';
import { useEpicStore } from '../store/useEpicStore';
import { useGeneratedEpicStore } from '../store/useGeneratedEpicStore';
import debounce from 'lodash.debounce';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { generateEpic } from '../services/aiService';
import { useSettingsStore } from '../store/useSettingsStore';
import { usePrefixStore } from '../store/usePrefixStore';
import { buttonVariants } from './ui/button';
import { cn } from '../lib/utils';
import { Select } from './ui/select';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';


const EpicCreator = () => {
  const { labels, setLabels } = useLabelStore();
  const { selectedEpic: parentEpic, setEpic: setParentEpic } = useEpicStore();
  const { generatedContent, updateField, clearContent } = useGeneratedEpicStore();

  // Use generated content from store or fallback to empty values
  const titlePrefix = generatedContent?.titlePrefix || '';
  const title = generatedContent?.title || '';
  const description = generatedContent?.description || '';
  const selectedLabels = generatedContent?.selectedLabels || [];
  const prompt = generatedContent?.prompt || '';
  const enableEpic = generatedContent?.enableEpic || false;
  const storedParentEpic = generatedContent?.parentEpic;

  const [parentQuery, setParentQuery] = useState('');
  const [parentResults, setParentResults] = useState<{ id: number; title: string; web_url: string }[]>([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [createdEpic, setCreatedEpic] = useState<{ iid: number; url: string } | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const { aiBackend, groupId } = useSettingsStore();
  const { prefixes } = usePrefixStore();

  useEffect(() => {
    const fetch = async () => {
      if (!groupId || labels.length) return;
      try {
        const data = await gitlabService.fetchLabels(groupId);
        setLabels(data);
      } catch (e: any) {
        setMessage(e.message || 'Failed to fetch labels');
      }
    };
    fetch();
  }, [groupId, labels.length, setLabels]);

  const debouncedSearch = useMemo(
    () =>
      debounce(async (q: string) => {
        if (!groupId) return;
        setSearching(true);
        try {
          const res = await gitlabService.searchEpics(groupId, q);
          setParentResults(res);
        } catch (e) {
          console.error(e);
        } finally {
          setSearching(false);
        }
      }, 400),
    [groupId],
  );

  useEffect(() => {
    if (parentQuery.trim().length >= 3) {
      debouncedSearch(parentQuery.trim());
    } else {
      setParentResults([]);
    }
  }, [parentQuery, debouncedSearch]);

  const toggleLabel = (name: string) => {
    const newLabels = selectedLabels.includes(name)
      ? selectedLabels.filter(l => l !== name)
      : [...selectedLabels, name];
    updateField('selectedLabels', newLabels);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await generateEpic(prompt, aiBackend);
      const { title: aiTitle, description: aiDesc } = res;
      updateField('title', aiTitle);
      updateField('description', aiDesc);
    } catch (e: any) {
      setMessage(e.message || 'Failed to generate');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEpic = async () => {
    if (!groupId) {
      setMessage('Group ID missing');
      return;
    }
    if (!title.trim()) {
      setMessage('Title empty');
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const fullTitle = titlePrefix ? `${titlePrefix} ${title}` : title;
      const epicToUse = storedParentEpic || parentEpic;
      const res = await gitlabService.createEpic(groupId, fullTitle, description, selectedLabels, epicToUse?.id, enableEpic);
      setMessage(`Epic created: ${res.web_url}`);
      setCreatedEpic({ iid: res.iid, url: res.web_url });
      // Clear the generated content after successful creation
      clearContent();
    } catch (e: any) {
      setMessage(e.message || 'Failed to create epic');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="max-w-3xl flex flex-col gap-6">


        <div>
          <Label>Prompt</Label>
          <Textarea
            rows={3}
            value={prompt}
            onChange={e => updateField('prompt', e.target.value)}
          />
          <Button
            className="mt-2"
            variant="primary"
            size="sm"
            loading={loading}
            onClick={handleGenerate}
          >
            Generate with AI
          </Button>
        </div>

        <div>
          <Label>Title Prefix</Label>
          <Select
            value={titlePrefix}
            onChange={e => updateField('titlePrefix', e.target.value)}
          >
            <option value="">Select prefix</option>
            {prefixes.map(p => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <Label required>Title</Label>
          <Input
            value={title}
            onChange={e => updateField('title', e.target.value)}
          />
        </div>

        <div>
          <Label>Description</Label>
          <Textarea
            rows={6}
            value={description}
            onChange={e => updateField('description', e.target.value)}
          />
        </div>

        <div>
          <Label>Labels</Label>
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto border p-2 rounded-md">
            {labels.map(l => (
              <Checkbox
                key={l.name}
                label={l.name}
                checked={selectedLabels.includes(l.name)}
                onChange={() => toggleLabel(l.name)}
                size="sm"
              />
            ))}
          </div>
        </div>

        <Checkbox
          label="Link Epic"
          checked={enableEpic}
          onChange={e => updateField('enableEpic', e.target.checked)}
        />

        {enableEpic && (<div>
          <Label>Parent Epic (optional)</Label>
          <Input
            placeholder="Search parent epic by title..."
            value={parentQuery}
            onChange={e => setParentQuery(e.target.value)}
          />
          {searching && <p className="text-sm">Searching...</p>}
          {parentResults.length > 0 && (
            <div className="border border-border max-h-48 overflow-y-auto rounded-md bg-popover mt-1">
              {parentResults.map(ep => (
                <div
                  key={ep.id}
                  className="px-2 py-1 hover:bg-accent hover:text-accent-foreground cursor-pointer text-sm"
                  onClick={() => {
                    setParentEpic(ep);
                    updateField('parentEpic', ep);
                    setParentQuery(ep.title);
                    setParentResults([]);
                  }}
                >
                  {ep.title}
                </div>
              ))}
            </div>
          )}
          {(storedParentEpic || parentEpic) && <p className="text-sm mt-1 text-app-semantic-success">Selected: {(storedParentEpic || parentEpic)?.title}</p>}
        </div>)}

        {createdEpic ? (
          <a
            href={createdEpic.url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants({ variant: "success" }))}
          >
            Epic #{createdEpic.iid} created
          </a>
        ) : (
          <Button
            variant="primary"
            size="md"
            loading={loading}
            onClick={handleCreateEpic}
          >
            Create Epic
          </Button>
        )}

        {message && <p className="mt-2 text-sm">{message}</p>}
      </div>
      <div className="max-w-3xl mx-auto flex flex-col gap-6">
        <h2 className="text-lg font-medium">Preview</h2>

        <h1>{titlePrefix ? `${titlePrefix} ${title}` : title}</h1>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{description}</ReactMarkdown>
      </div>
    </div>
  );
};

export default EpicCreator;
