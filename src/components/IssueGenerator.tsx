import { useState, useEffect, useMemo } from 'react';
import { generateIssue } from '../services/aiService';
import gitlabService from '../services/gitlabService';
import { useLabelStore } from '../store/useLabelStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useTabStore } from '../store/useTabStore';
import ReactMarkdown from 'react-markdown';
import { useEpicStore } from '../store/useEpicStore';
import { useGeneratedIssueStore } from '../store/useGeneratedIssueStore';
import remarkGfm from 'remark-gfm';
import debounce from 'lodash.debounce';
import { usePrefixStore } from '../store/usePrefixStore';
import { Select, Textarea, Button, Input, Label, Checkbox } from './ui';


const IssueGenerator = () => {
  const { labels, setLabels, keywords } = useLabelStore();
  const { selectedEpic, setEpic } = useEpicStore();
  const { setTab } = useTabStore();
  const { generatedContent, updateField, clearContent } = useGeneratedIssueStore();

  // Use generated content from store or fallback to empty values
  const prompt = generatedContent?.prompt || '';
  const draftTitle = generatedContent?.draftTitle || '';
  const draftDescription = generatedContent?.draftDescription || '';
  const selectedLabels = generatedContent?.selectedLabels || [];
  const enableEpic = generatedContent?.enableEpic || false;
  const epicQuery = generatedContent?.epicQuery || '';
  const storedSelectedEpic = generatedContent?.selectedEpic;

  const [createdIssue, setCreatedIssue] = useState<{ iid: number; url: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [epicResults, setEpicResults] = useState<{ id: number; iid: number; title: string; web_url: string }[]>([]);
  const [searchingEpics, setSearchingEpics] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const { aiBackend, projectId, groupId } = useSettingsStore();
  const { prefixes } = usePrefixStore();

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
          if (res.length) {
            setEpic(res[0]);
            updateField('selectedEpic', res[0]);
          }
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

      updateField('draftTitle', title);
      updateField('draftDescription', fullDescription);
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

      const epicToUse = storedSelectedEpic || selectedEpic;
      if (enableEpic && epicToUse) {
        try {
          await gitlabService.addIssueToEpic(groupId!, epicToUse.iid!, projectId, res.id);
        } catch (err: any) {
          console.error(err);
          setMessage(`Issue created but failed to link epic: ${err.message}`);
          return;
        }
      }
      setMessage(`Issue created: ${res.web_url}`);
      setCreatedIssue({ iid: res.iid, url: res.web_url });
      // Clear the generated content after successful creation
      clearContent();
    } catch (err: any) {
      setMessage(err.message || 'Failed to create issue');
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
            value={prompt}
            onChange={e => updateField('prompt', e.target.value)}
            rows={3}
          />
          <Button
            className="mt-4"
            variant="primary"
            size="md"
            loading={loading}
            onClick={handleGenerate}
          >
            Generate with AI
          </Button>
          {message && <p className="mt-2 text-sm">{message}</p>}
        </div>

        <div>
          <Label>Title Prefix</Label>
          <Select
            onChange={e => {
              const prefix = e.target.value;
              if (prefix) {
                updateField('draftTitle', `${prefix} ${draftTitle}`);
              }
            }}
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
            value={draftTitle}
            onChange={e => updateField('draftTitle', e.target.value)}
          />
        </div>

        <div>
          <Label>Description (Markdown)</Label>
          <Textarea
            value={draftDescription}
            onChange={e => updateField('draftDescription', e.target.value)}
            rows={8}
          />
        </div>

        <div>
          <Label>Labels</Label>
          <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
            {labels
              .filter(l => {
                if (!keywords.trim()) return true;
                const kws = keywords.toLowerCase().split(',').map(k => k.trim()).filter(Boolean);
                return kws.some(k => l.name.toLowerCase().includes(k));
              })
              .map(l => (
                <Checkbox
                  key={l.id}
                  label={l.name}
                  checked={selectedLabels.includes(l.name)}
                  onChange={e => {
                    const newLabels = e.target.checked
                      ? [...selectedLabels, l.name]
                      : selectedLabels.filter(name => name !== l.name);
                    updateField('selectedLabels', newLabels);
                  }}
                  size="sm"
                />
              ))}
          </div>

          <div className="mt-4">
            <Checkbox
              label="Link Epic"
              checked={enableEpic}
              onChange={e => updateField('enableEpic', e.target.checked)}
            />
            {enableEpic && (
              <div className="mt-2">
                <Input
                  value={epicQuery}
                  onChange={e => {
                    updateField('epicQuery', e.target.value);
                  }}
                  placeholder="Paste epic URL or search title..."
                  className="mb-2"
                />
                {searchingEpics && <p className="text-sm">Searching...</p>}
                {epicResults.length > 0 && (
                  <div className="border border-border max-h-48 overflow-y-auto rounded-md bg-popover">
                    {epicResults.map(er => (
                      <div
                        key={er.id}
                        className="px-2 py-1 hover:bg-accent hover:text-accent-foreground cursor-pointer text-sm"
                        onClick={() => {
                          setEpic(er);
                          updateField('selectedEpic', er);
                          updateField('epicQuery', er.title);
                          setEpicResults([]);
                        }}
                      >
                        {er.title}
                      </div>
                    ))}
                  </div>
                )}
                {(storedSelectedEpic || selectedEpic) && (
                  <p className="text-sm mt-1 text-app-semantic-success">Selected: {(storedSelectedEpic || selectedEpic)?.title}</p>
                )}
              </div>
            )}
          </div>
          <Button
            className="mt-2"
            variant="secondary"
            size="sm"
            onClick={() => setTab('settings')}
          >
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
            loading={loading}
            onClick={handleCreateIssue}
          >
            Create Issue in GitLab
          </Button>
        )}

        {message && (
          <p className={`mt-2 text-sm text-center ${message.startsWith('Issue created') ? 'text-green-600' : 'text-destructive'}`}>
            {message}
          </p>
        )}
      </div>
      <div className="max-w-3xl mx-auto flex flex-col gap-6">
        <h2 className="text-lg font-medium">Preview</h2>
        {draftTitle && draftDescription && (
          <div className="bg-app-surface-primary rounded-md p-4">
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
