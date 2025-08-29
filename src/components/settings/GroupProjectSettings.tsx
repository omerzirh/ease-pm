import { useEffect, useState } from 'react';
import gitlabService from '../../services/gitlabService';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useGitlabAuth } from '../../store/useGitlabAuth';

interface GitlabProject {
  id: number;
  name: string;
  path_with_namespace: string;
}

const GroupProjectSettings = () => {
  const { token } = useGitlabAuth();
  const {
    groupId,
    projectId,
    projectName,
    setGroupId,
    setProjectId,
    setProjectName,
  } = useSettingsStore();

  const [groupInput, setGroupInput] = useState(groupId || '');
  const [projectOptions, setProjectOptions] = useState<GitlabProject[]>([]);
  const [selectedProject, setSelectedProject] = useState(projectId || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (groupId && token && editing) {
      handleFetchProjects(groupId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing]);

  const handleSaveGroup = async () => {
    if (!groupInput.trim()) {
      setMessage('Group ID is required');
      return;
    }
    setGroupId(groupInput.trim());
    setSelectedProject('');
    setProjectId('');
    await handleFetchProjects(groupInput.trim());
    setMessage('Group ID saved');
  };

  const handleFetchProjects = async (gid: string) => {
    if (!token) {
      setMessage('Please login to GitLab first');
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const projects = await gitlabService.fetchProjects(gid);
      setProjectOptions(projects);
    } catch (err: any) {
      setMessage(err.message || 'Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProject = () => {
    if (!selectedProject) {
      setMessage('Please select a project');
      return;
    }
    const selectedProjectObj = projectOptions.find(p => p.id === Number(selectedProject));
    if (!selectedProjectObj) {
      setMessage('Project not found');
      return;
    }
    console.log(selectedProjectObj);
    setProjectId(selectedProject);
    setProjectName(selectedProjectObj.path_with_namespace);
    setEditing(false);
    setMessage('Project saved');
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
            <span className="font-medium">Group ID:</span> {groupId || 'Not set'}
          </p>
          <p className="mb-4 text-sm">
            <span className="font-medium">Project ID:</span> {projectId || 'Not set'}
          </p>
          <button
            className="px-4 py-2 bg-app-interactive-primary hover:bg-app-interactive-primary-hover text-app-text-inverse rounded-md transition-colors"
            onClick={() => setEditing(true)}
          >
            Edit
          </button>
        </>
      ) : (
        <>
          <label className="block text-sm font-medium mb-1">Group ID / Path</label>
          <input
            value={groupInput}
            onChange={e => setGroupInput(e.target.value)}
            className="w-full border border-app-border-primary focus:border-app-border-focus focus:ring-2 focus:ring-app-border-focus rounded-md p-2 mb-2 bg-app-surface-primary text-app-text-primary placeholder:text-app-text-tertiary transition-colors"
            placeholder="e.g. 123456 or my-group"
          />
          <button
            className="px-4 py-2 bg-app-interactive-primary hover:bg-app-interactive-primary-hover text-app-text-inverse rounded-md disabled:bg-app-interactive-disabled disabled:opacity-50 mb-4 transition-colors"
            onClick={handleSaveGroup}
            disabled={!groupInput.trim() || loading}
          >
            Save Group & Fetch Projects
          </button>

          {projectOptions.length > 0 && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Select Project</label>
              <select
                value={selectedProject}
                onChange={e => setSelectedProject(e.target.value)}
                className="w-full border border-app-border-primary focus:border-app-border-focus focus:ring-2 focus:ring-app-border-focus rounded-md p-2 bg-app-surface-primary text-app-text-primary transition-colors"
              >
                <option value="">-- choose a project --</option>
                {projectOptions.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.path_with_namespace}
                  </option>
                ))}
              </select>
              <button
                className="mt-2 px-4 py-2 bg-app-interactive-primary hover:bg-app-interactive-primary-hover text-app-text-inverse rounded-md disabled:bg-app-interactive-disabled disabled:opacity-50 transition-colors"
                onClick={handleSaveProject}
                disabled={!selectedProject}
              >
                Save Project
              </button>
            </div>
          )}
          <button
            className="px-4 py-2 bg-app-interactive-secondary text-app-text-primary rounded-md hover:bg-app-interactive-secondary-hover transition-colors"
            onClick={() => setEditing(false)}
          >
            Cancel
          </button>
        </>
      )}

      {message && <p className="mt-2 text-sm">{message}</p>}
    </div>
  );
};

export default GroupProjectSettings;
