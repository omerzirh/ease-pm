import { useState } from 'react';
import { GitlabProject, GitlabGroup } from '../../services/gitlabService';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useEpicStore } from '../../store/useEpicStore';
import { useGeneratedEpicStore } from '../../store/useGeneratedEpicStore';
import { useGeneratedIssueStore } from '../../store/useGeneratedIssueStore';
import { useLabelStore } from '../../store/useLabelStore';

import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import RecursiveGroupProjectSelector from './RecursiveGroupProjectSelector';

const GroupProjectSettings = () => {
  const {
    groupId,
    projectId,
    projectName,
    teamGroupId,
    teamGroupName,
    setGroupId,
    setProjectId,
    setProjectName,
    setTeamGroupId,
    setTeamGroupName
  } = useSettingsStore();
  const { setEpic } = useEpicStore();
  const { clearContent: clearEpicContent } = useGeneratedEpicStore();
  const { clearContent: clearIssueContent } = useGeneratedIssueStore();
  const { setLabels } = useLabelStore();

  const [groupInput, setGroupInput] = useState(groupId || '');
  const [message, setMessage] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [showSelector, setShowSelector] = useState(false);
  const [selectorSessionKey, setSelectorSessionKey] = useState(0);

  const handleStartSelection = () => {
    if (!groupInput.trim()) {
      setMessage('Group ID is required');
      return;
    }
    setMessage(null);
    setShowSelector(true);
    // Increment session key to reset the selector's session state
    setSelectorSessionKey(prev => prev + 1);
  };

  const handleProjectSelect = (project: GitlabProject, rootGroupId: string) => {
    // Use the root group ID that was passed from the selector
    setGroupId(rootGroupId);
    setProjectId(project.id.toString());
    setProjectName(project.path_with_namespace);

    // Clear related stores
    setEpic(null);
    clearEpicContent();
    clearIssueContent();
    setLabels([]);

    setEditing(false);
    setShowSelector(false);
    setMessage(`Project "${project.name}" selected successfully. Root group: ${rootGroupId}, Project path: ${project.path_with_namespace}`);
  };

  const handleTeamGroupSelect = (group: GitlabGroup) => {
    setTeamGroupId(group.id.toString());
    setTeamGroupName(group.full_path);
    setMessage(`Team group "${group.name}" saved successfully for epic management`);
  };

  const handleSelectorError = (error: string) => {
    setMessage(error);
  };

  return (
    <div className="max-w-xl">
      <h2 className="text-xl font-semibold mb-4">GitLab Group & Project</h2>
 

      {!editing ? (
        <>
          <p className="mb-2 text-sm">
            <span className="font-medium">Group/Project Name:</span> {projectName || 'Not set'}
          </p>
          <p className="mb-2 text-sm">
            <span className="font-medium">Root Group ID:</span> {groupId || 'Not set'}
          </p>
          <p className="mb-2 text-sm">
            <span className="font-medium">Project ID:</span> {projectId || 'Not set'}
          </p>
          <p className="mb-2 text-sm">
            <span className="font-medium">Team Group:</span> {teamGroupName || 'Not set'}
          </p>
          <p className="mb-4 text-sm">
            <span className="font-medium">Team Group ID:</span> {teamGroupId || 'Not set'}
          </p>
          <div className="flex gap-2">
            <Button variant="primary" onClick={() => setEditing(true)}>
              Edit
            </Button>
            {teamGroupId && (
              <Button
                variant="secondary"
                onClick={() => {
                  setTeamGroupId('');
                  setTeamGroupName('');
                  setMessage('Team group cleared');
                }}
              >
                Clear Team Group
              </Button>
            )}
          </div>
        </>
      ) : (
        <>
          <Label required>Group ID / Path</Label>
          <Input
            value={groupInput}
            onChange={(e) => setGroupInput(e.target.value)}
            placeholder="e.g. 123456 or my-group"
            className="mb-2"
          />
          <Button
            variant="primary"
            className="mb-4"
            onClick={handleStartSelection}
            disabled={!groupInput.trim()}
          >
            Browse Groups & Projects
          </Button>

          {showSelector && (
            <div className="mb-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-medium">Browse Groups & Projects</h3>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowSelector(false)}
                >
                  Close Browser
                </Button>
              </div>
              <RecursiveGroupProjectSelector
                key={selectorSessionKey}
                initialGroupId={groupInput.trim()}
                onProjectSelect={handleProjectSelect}
                onTeamGroupSelect={handleTeamGroupSelect}
                onError={handleSelectorError}
              />
            </div>
          )}

          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => {
              setEditing(false);
              setShowSelector(false);
            }}>
              Cancel
            </Button>
          </div>
        </>
      )}

      {message && <p className="mt-2 text-sm">{message}</p>}

           <div className="mb-4 mt-8 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>Root Group:</strong> The top-level group you start browsing from<br />
          <strong>Team Group:</strong> The group used for creating and managing epics<br />
          <strong>Project:</strong> The specific project for creating issues
        </p>
      </div>
    </div>
  );
};

export default GroupProjectSettings;
