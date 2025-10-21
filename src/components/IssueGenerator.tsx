import { useState, useEffect, useMemo } from 'react';
import { generateIssue } from '../services/aiService';
import gitlabService from '../services/gitlabService';
import { useLabelStore, filterLabelsByKeywords } from '../store/useLabelStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useTabStore } from '../store/useTabStore';
import ReactMarkdown from 'react-markdown';
import { useEpicStore } from '../store/useEpicStore';
import remarkGfm from 'remark-gfm';
import debounce from 'lodash.debounce';
import { usePrefixStore } from '../store/usePrefixStore';
import { Select, Textarea, Button, Input, Label, Checkbox } from './ui';

const IssueGenerator = () => {
  const [prompt, setPrompt] = useState('');
  const [draftTitle, setDraftTitle] = useState('');
  const [draftDescription, setDraftDescription] = useState('');
  const { labels, setLabels, issueKeywords } = useLabelStore();
  const { selectedEpic, setEpic } = useEpicStore();
  const { setTab } = useTabStore();
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [createdIssue, setCreatedIssue] = useState<{ iid: number; url: string } | null>(null);
  const [loadingGenerate, setLoadingGenerate] = useState(false);
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [enableEpic, setEnableEpic] = useState(false);
  const [epicQuery, setEpicQuery] = useState('');
  const [epicResults, setEpicResults] = useState<{ id: number; iid: number; title: string; web_url: string }[]>([]);
  const [searchingEpics, setSearchingEpics] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const { aiBackend, projectId, groupId } = useSettingsStore();
  const {issuePrefixes  } = usePrefixStore();

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
          setEpicResults(res.map((e) => ({ id: e.id, iid: e.iid, title: e.title, web_url: e.web_url })));
        } catch (e) {
          console.error(e);
        } finally {
          setSearchingEpics(false);
        }
      }, 400),
    [groupId]
  );

  useEffect(() => {
    if (!enableEpic) return;

    const urlMatch = /epics\/(\d+)/.exec(epicQuery);
    if (urlMatch) {
      const iid = urlMatch[1];
      if (groupId) {
        gitlabService.searchEpics(groupId, iid).then((res) => {
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

    setLoadingGenerate(true);
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
      setLoadingGenerate(false);
    }
  };

  const fetchLabels = async () => {
    if (labels.length > 0) return; // already have labels

    if (!projectId) return;
    setLoadingCreate(true);
    try {
      const data = await gitlabService.fetchLabels(projectId);
      setLabels(data);
    } catch (err: any) {
      setMessage(err.message || 'Failed to fetch labels');
    } finally {
      setLoadingCreate(false);
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
    setLoadingCreate(true);
    setMessage(null);
    try {
      const res = await gitlabService.createIssue(projectId, draftTitle, draftDescription, selectedLabels);
      console.log(res);

      if (enableEpic && selectedEpic) {
        try {
          await gitlabService.addIssueToEpic(groupId!, selectedEpic.iid!, projectId, res.id);
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
      setLoadingCreate(false);
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="max-w-3xl flex flex-col gap-6">
        <div>
          <Label>Prompt</Label>
          <Textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={3} />
          <Button
            className="mt-4"
            variant="primary"
            size="md"
            loading={loadingGenerate}
            disabled={loadingGenerate || loadingCreate}
            onClick={handleGenerate}
          >
            Generate with AI
          </Button>
          {message && <p className="mt-2 text-sm">{message}</p>}
        </div>

        <div>
          <Label>Title Prefix</Label>
          <Select
            onChange={(e) => {
              const prefix = e.target.value;
              if (prefix) {
                setDraftTitle(`${prefix} ${draftTitle}`);
              }
            }}
          >
            <option value="">Select prefix</option>
            {issuePrefixes.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <Label required>Title</Label>
          <Input value={draftTitle} onChange={(e) => setDraftTitle(e.target.value)} />
        </div>

        <div>
          <Label>Description (Markdown)</Label>
          <Textarea value={draftDescription} onChange={(e) => setDraftDescription(e.target.value)} rows={8} />
        </div>

        <div>
          <Label>Labels</Label>
          <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
            {filterLabelsByKeywords(labels, issueKeywords).map((l) => (
              <Checkbox
                key={l.id}
                label={l.name}
                checked={selectedLabels.includes(l.name)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedLabels((prev) => [...prev, l.name]);
                  } else {
                    setSelectedLabels((prev) => prev.filter((name) => name !== l.name));
                  }
                }}
                size="sm"
              />
            ))}
          </div>

          <div className="mt-4">
            <Checkbox label="Link Epic" checked={enableEpic} onChange={(e) => setEnableEpic(e.target.checked)} />
            {enableEpic && (
              <div className="mt-2">
                <Input
                  value={epicQuery}
                  onChange={(e) => {
                    setEpicQuery(e.target.value);
                  }}
                  placeholder="Paste epic URL or search title..."
                  className="mb-2"
                />
                {searchingEpics && <p className="text-sm">Searching...</p>}
                {epicResults.length > 0 && (
                  <div className="border border-border max-h-48 overflow-y-auto rounded-md bg-popover">
                    {epicResults.map((er) => (
                      <div
                        key={er.id}
                        className="px-2 py-1 hover:bg-accent hover:text-accent-foreground cursor-pointer text-sm"
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
                  <p className="text-sm mt-1 text-app-semantic-success">Selected: {selectedEpic.title}</p>
                )}
              </div>
            )}
          </div>
          <Button className="mt-2" variant="secondary" size="sm" onClick={() => setTab('settings')}>
            Edit Labels
          </Button>
        </div>

        {createdIssue ? (
          <a
            href={createdIssue.url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-green-700 hover:bg-green-800 text-white rounded-md inline-block"
          >
            Issue #{createdIssue.iid} created
          </a>
        ) : (
          <Button
            variant="primary"
            size="md"
            loading={loadingCreate}
            disabled={loadingGenerate || loadingCreate}
            onClick={handleCreateIssue}
          >
            Create Issue in GitLab
          </Button>
        )}

        {message && (
          <p
            className={`mt-2 text-sm text-center ${message.startsWith('Issue created') ? 'text-green-600' : 'text-destructive'}`}
          >
            {message}
          </p>
        )}
      </div>
      <div className="max-w-3xl mx-auto flex flex-col gap-6">
        <h2 className="text-lg font-medium">Preview</h2>
        {draftTitle && draftDescription && (
          <div className="bg-app-surface-primary rounded-md p-4">
            <h3 className="text-lg font-medium">{draftTitle}</h3>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{draftDescription}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
};
export default IssueGenerator;
