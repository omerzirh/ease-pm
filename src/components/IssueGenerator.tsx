import { useState, useEffect, useMemo } from 'react';
import { generateIssue } from '../services/aiService';
import { GoogleGenAI } from '@google/genai';
import gitlabService from '../services/gitlabService';
import { useLabelStore } from '../store/useLabelStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useTabStore } from '../store/useTabStore';
import ReactMarkdown from 'react-markdown';
import { useEpicStore } from '../store/useEpicStore';
import remarkGfm from 'remark-gfm';
import debounce from 'lodash.debounce';
import { useGitlabAuth } from '../store/useGitlabAuth';

const TITLE_PREFIXES = ['iOS | Biometrics |', 'Web | PIN |'];

const IssueGenerator = () => {
  const [prompt, setPrompt] = useState('');
  const [draftTitle, setDraftTitle] = useState('');
  const [draftDescription, setDraftDescription] = useState('');
  const projectId = import.meta.env.VITE_GITLAB_PROJECT_ID as string;
  const { labels, setLabels, keywords, setKeywords } = useLabelStore();
  const { selectedEpic, setEpic } = useEpicStore();
  const { setTab } = useTabStore();
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [createdIssue, setCreatedIssue] = useState<{ iid: number; url: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [enableEpic, setEnableEpic] = useState(false);
  const [epicQuery, setEpicQuery] = useState('');
  const [epicResults, setEpicResults] = useState<{ id: number; iid: number; title: string; web_url: string }[]>([]);
  const [searchingEpics, setSearchingEpics] = useState(false);
  const groupId = import.meta.env.VITE_GITLAB_GROUP_ID as string;
  const [message, setMessage] = useState<string | null>(null);
  const { aiBackend } = useSettingsStore();

  useEffect(() => {
    if (projectId && labels.length === 0) {
      fetchLabels();
    }
  }, [projectId]);

  const debouncedSearchEpics = useMemo(
    () =>
      debounce(async (q: string) => {
        if (!groupId) return;
        setSearchingEpics(true);
        try {
          const res = await gitlabService.searchEpics(groupId, q);
          setEpicResults(res.map(e => ({ id: e.id, iid: e.iid, title: e.title, web_url: e.web_url })));
        } catch (e) {
          console.error(e);
        } finally {
          setSearchingEpics(false);
        }
      }, 400),
    [groupId],
  );

  useEffect(() => {
    if (!enableEpic) return;

    const urlMatch = /epics\/(\d+)/.exec(epicQuery);
    if (urlMatch) {
      const iid = urlMatch[1];
      if (groupId) {
        gitlabService.searchEpics(groupId, iid).then(res => {
          if (res.length) setEpic(res[0]);
        });
      }
      setEpicResults([]);
      return;
    }

    if (epicQuery.trim().length >= 3) {
      debouncedSearchEpics(epicQuery.trim());
    } else {
      setEpicResults([]);
    }
  }, [epicQuery, enableEpic, debouncedSearchEpics, setEpic]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
  
    setLoading(true);
    setMessage(null);
  
    try {
      const res = await generateIssue(prompt, aiBackend);

      const { title, description, acceptanceCriteria, dependencies } = res;
  
      let fullDescription = description;
      if (acceptanceCriteria) {
        fullDescription += `\n\n### Acceptance Criteria\n${acceptanceCriteria}`;
      }
      if (dependencies) {
        fullDescription += `\n\n### Dependencies\n${dependencies}`;
      }
  
      setDraftTitle(title);
      setDraftDescription(fullDescription);
    } catch (err: any) {
      setMessage(err.message || 'Failed to generate');
    } finally {
      setLoading(false);
    }
  };
  

  const fetchLabels = async () => {
    if (labels.length > 0) return; // already have labels

    if (!projectId) return;
    setLoading(true);
    try {
      const data = await gitlabService.fetchLabels(projectId);
      setLabels(data);
    } catch (err: any) {
      setMessage(err.message || 'Failed to fetch labels');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateIssue = async () => {
    if (!projectId) {
      setMessage('Provide a project ID.');
      return;
    }
    if (!draftTitle.trim()) {
      setMessage('Title is empty.');
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const res = await gitlabService.createIssue(projectId, draftTitle, draftDescription, selectedLabels);
    console.log(res)

    if (enableEpic && selectedEpic) {
      try {
        await gitlabService.addIssueToEpic(groupId, selectedEpic.iid!, projectId, res.id);
      } catch (err: any) {
        console.error(err);
        setMessage(`Issue created but failed to link epic: ${err.message}`);
        return;
      }
    }
      setMessage(`Issue created: ${res.web_url}`);
    setCreatedIssue({ iid: res.iid, url: res.web_url });
    } catch (err: any) {
      setMessage(err.message || 'Failed to create issue');
    } finally {
      setLoading(false);
    }
  };

  const login = useGitlabAuth(state => state.login);


  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="max-w-3xl mx-auto flex flex-col gap-6">
      <button onClick={login}>Login with GitLab</button>

        <div>
          <label className="block text-sm font-medium mb-1">Prompt</label>
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            rows={3}
            className="w-full border border-gray-300 dark:border-gray-700 rounded-md p-2 bg-white dark:bg-gray-800"
          />
          <button
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50"
            disabled={loading}
            onClick={handleGenerate}
          >
            {loading ? 'Generating...' : 'Generate with AI'}
          </button>
          {message && <p className="mt-2 text-sm">{message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Title Prefix</label>
          <select
            className="w-full border border-gray-300 dark:border-gray-700 rounded-md p-2 bg-white dark:bg-gray-800"
            onChange={e => {
              const prefix = e.target.value;
              if (prefix) {
                setDraftTitle(`${prefix} ${draftTitle}`);
              }
            }}
          >
            <option value="">Select prefix</option>
            {TITLE_PREFIXES.map(p => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Title</label>
          <input
            value={draftTitle}
            onChange={e => setDraftTitle(e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-700 rounded-md p-2 bg-white dark:bg-gray-800"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description (Markdown)</label>
          <textarea
            value={draftDescription}
            onChange={e => setDraftDescription(e.target.value)}
            rows={8}
            className="w-full border border-gray-300 dark:border-gray-700 rounded-md p-2 bg-white dark:bg-gray-800"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Labels</label>
          <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
            {labels
              .filter(l => {
                if (!keywords.trim()) return true;
                const kws = keywords.toLowerCase().split(',').map(k => k.trim()).filter(Boolean);
                return kws.some(k => l.name.toLowerCase().includes(k));
              })
              .map(l => (
              <label key={l.id} className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={selectedLabels.includes(l.name)}
                  onChange={e => {
                    if (e.target.checked) {
                      setSelectedLabels(prev => [...prev, l.name]);
                    } else {
                      setSelectedLabels(prev => prev.filter(name => name !== l.name));
                    }
                  }}
                />
                {l.name}
              </label>
            ))}
          </div>

        <div className="mt-4">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={enableEpic} onChange={e => setEnableEpic(e.target.checked)} />
            Link Epic
          </label>
          {enableEpic && (
            <div className="mt-2">
              <input
                value={epicQuery}
                onChange={e => {
                  setEpicQuery(e.target.value);
                }}
                placeholder="Paste epic URL or search title..."
                className="w-full border border-gray-300 dark:border-gray-700 rounded-md p-2 bg-white dark:bg-gray-800 mb-2"
              />
              {searchingEpics && <p className="text-sm">Searching...</p>}
              {epicResults.length > 0 && (
                <div className="border max-h-48 overflow-y-auto rounded-md bg-white dark:bg-gray-900">
                  {epicResults.map(er => (
                    <div
                      key={er.id}
                      className="px-2 py-1 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer text-sm"
                      onClick={() => {
                        setEpic(er);
                        setEpicQuery(er.title);
                        setEpicResults([]);
                      }}
                    >
                      {er.title}
                    </div>
                  ))}
                </div>
              )}
              {selectedEpic && (
                <p className="text-sm mt-1 text-green-600">Selected: {selectedEpic.title}</p>
              )}
            </div>
          )}
        </div>
          <button
            className="mt-2 px-3 py-1 bg-gray-300 dark:bg-gray-600 rounded-md text-sm"
            onClick={() => setTab('settings')}
          >
            Edit Labels
          </button>
        </div>

        {createdIssue ? (
            <a
              href={createdIssue.url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-green-700 text-white rounded-md inline-block"
            >
              Issue #{createdIssue.iid} created
            </a>
          ) : (
            <button
              className="px-4 py-2 bg-green-600 text-white rounded-md disabled:opacity-50"
              onClick={handleCreateIssue}
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Issue in GitLab'}
            </button>
          )}

        {message && (
          <p className="mt-2 text-sm text-center {message.startsWith('Issue created') ? 'text-green-600' : 'text-red-600'}">
            {message}
          </p>
        )}
      </div>
      <div className="max-w-3xl mx-auto flex flex-col gap-6">
        <h2 className="text-lg font-medium">Preview</h2>
        {draftTitle && draftDescription && (
          <div className="bg-white dark:bg-gray-800 rounded-md p-4">
            <h3 className="text-lg font-medium">{draftTitle}</h3>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {draftDescription}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
export default IssueGenerator;
