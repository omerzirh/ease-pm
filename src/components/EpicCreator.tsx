import { useState, useEffect, useMemo } from 'react';
import gitlabService from '../services/gitlabService';
import { useLabelStore } from '../store/useLabelStore';
import { useEpicStore } from '../store/useEpicStore';
import debounce from 'lodash.debounce';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { generateEpic } from '../services/aiService';
import { useSettingsStore } from '../store/useSettingsStore';
import { usePrefixStore } from '../store/usePrefixStore';


const EpicCreator = () => {
  const { labels, setLabels } = useLabelStore();
  const { selectedEpic: parentEpic, setEpic: setParentEpic } = useEpicStore();

  const [titlePrefix, setTitlePrefix] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [parentQuery, setParentQuery] = useState('');
  const [parentResults, setParentResults] = useState<{ id: number; title: string; web_url: string }[]>([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [createdEpic, setCreatedEpic] = useState<{ iid: number; url: string } | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [enableEpic, setEnableEpic] = useState(false);
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
    setSelectedLabels(prev =>
      prev.includes(name) ? prev.filter(l => l !== name) : [...prev, name],
    );
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await generateEpic(prompt, aiBackend);
      const { title: aiTitle, description: aiDesc } = res;
      setTitle(aiTitle);
      setDescription(aiDesc);
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
      const res = await gitlabService.createEpic(groupId, fullTitle, description, selectedLabels, parentEpic?.id,enableEpic);
      setMessage(`Epic created: ${res.web_url}`);
    setCreatedEpic({ iid: res.iid, url: res.web_url });
    } catch (e: any) {
      setMessage(e.message || 'Failed to create epic');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="max-w-3xl mx-auto flex flex-col gap-6">


      <div>
        <label className="block text-sm font-medium mb-1">Prompt</label>
        <textarea
          rows={3}
          className="w-full border rounded-md p-2 bg-white dark:bg-gray-800"
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
        />
        <button
          className="mt-2 px-3 py-1 bg-blue-600 text-white rounded-md disabled:opacity-50"
          disabled={loading}
          onClick={handleGenerate}
        >
          {loading ? 'Generating...' : 'Generate with AI'}
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Title Prefix</label>
        <select
          className="w-full border rounded-md p-2 bg-white dark:bg-gray-800"
          value={titlePrefix}
          onChange={e => setTitlePrefix(e.target.value)}
        >
          <option value="">Select prefix</option>
          {prefixes.map(p => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Title</label>
        <input
          className="w-full border rounded-md p-2 bg-white dark:bg-gray-800"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <textarea
          rows={6}
          className="w-full border rounded-md p-2 bg-white dark:bg-gray-800"
          value={description}
          onChange={e => setDescription(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Labels</label>
        <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto border p-2 rounded-md">
          {labels.map(l => (
            <label key={l.name} className="text-sm flex items-center gap-1">
              <input type="checkbox" checked={selectedLabels.includes(l.name)} onChange={() => toggleLabel(l.name)} />
              {l.name}
            </label>
          ))}
        </div>
      </div>

      <label className="flex items-center gap-2">
            <input type="checkbox" checked={enableEpic} onChange={e => setEnableEpic(e.target.checked)} />
            Link Epic
          </label>
          
{enableEpic && (      <div>
        <label className="block text-sm font-medium mb-1">Parent Epic (optional)</label>
        <input
          className="w-full border rounded-md p-2 bg-white dark:bg-gray-800"
          placeholder="Search parent epic by title..."
          value={parentQuery}
          onChange={e => setParentQuery(e.target.value)}
        />
        {searching && <p className="text-sm">Searching...</p>}
        {parentResults.length > 0 && (
          <div className="border max-h-48 overflow-y-auto rounded-md bg-white dark:bg-gray-900 mt-1">
            {parentResults.map(ep => (
              <div
                key={ep.id}
                className="px-2 py-1 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer text-sm"
                onClick={() => {
                  setParentEpic(ep);
                  setParentQuery(ep.title);
                  setParentResults([]);
                }}
              >
                {ep.title}
              </div>
            ))}
          </div>
        )}
        {parentEpic && <p className="text-sm mt-1 text-green-600">Selected: {parentEpic.title}</p>}
      </div>)}

      {createdEpic ? (
        <a
          href={createdEpic.url}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-green-700 text-white rounded-md inline-block"
        >
          Epic #{createdEpic.iid} created
        </a>
      ) : (
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50"
          disabled={loading}
          onClick={handleCreateEpic}
        >
          {loading ? 'Creating...' : 'Create Epic'}
        </button>
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
