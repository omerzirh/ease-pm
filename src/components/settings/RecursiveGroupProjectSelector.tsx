import { useEffect, useState } from 'react';
import gitlabService, { GitlabGroup, GitlabProject } from '../../services/gitlabService';
import { useGitlabAuth } from '../../store/useGitlabAuth';
import { Select } from '../ui/select';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import { Button } from '../ui/button';

interface DropdownLevel {
  id: string;
  groups: GitlabGroup[];
  projects: GitlabProject[];
  selectedValue: string;
  loading: boolean;
  isTeamGroup: boolean;
  teamGroupSaved: boolean;
}

interface RecursiveGroupProjectSelectorProps {
  initialGroupId?: string;
  onProjectSelect: (project: GitlabProject, rootGroupId: string) => void;
  onTeamGroupSelect?: (group: GitlabGroup) => void;
  onError: (error: string) => void;
  resetSession?: boolean;
}

const RecursiveGroupProjectSelector = ({ 
  initialGroupId, 
  onProjectSelect, 
  onTeamGroupSelect,
  onError,
  resetSession = false
}: RecursiveGroupProjectSelectorProps) => {
  const { token } = useGitlabAuth();
  const [dropdownLevels, setDropdownLevels] = useState<DropdownLevel[]>([]);
  const [teamGroupSavedInSession, setTeamGroupSavedInSession] = useState(false);

  useEffect(() => {
    if (initialGroupId && token) {
      // Reset session state when starting fresh or when resetSession prop changes
      setTeamGroupSavedInSession(false);
      loadGroupContent(initialGroupId, 0);
    }
  }, [initialGroupId, token, resetSession]);

  const loadGroupContent = async (groupId: string, levelIndex: number) => {
    if (!token) {
      onError('Please login to GitLab first');
      return;
    }

    // Update loading state for this level
    setDropdownLevels(prev => {
      const newLevels = [...prev];
      if (newLevels[levelIndex]) {
        newLevels[levelIndex].loading = true;
      } else {
        newLevels[levelIndex] = {
          id: groupId,
          groups: [],
          projects: [],
          selectedValue: '',
          loading: true,
          isTeamGroup: false,
          teamGroupSaved: false
        };
      }
      // Remove all levels after this one
      return newLevels.slice(0, levelIndex + 1);
    });

    try {
      const content = await gitlabService.fetchGroupContent(groupId);
      
      setDropdownLevels(prev => {
        const newLevels = [...prev];
        newLevels[levelIndex] = {
          id: groupId,
          groups: content.groups,
          projects: content.projects,
          selectedValue: '',
          loading: false,
          isTeamGroup: false,
          teamGroupSaved: false
        };
        return newLevels;
      });
    } catch (err: unknown) {
      const errorMessage = (err instanceof Error && err.message) ? err.message : 'Failed to fetch group content';
      onError(errorMessage);
      
      setDropdownLevels(prev => {
        const newLevels = [...prev];
        if (newLevels[levelIndex]) {
          newLevels[levelIndex].loading = false;
        }
        return newLevels;
      });
    }
  };

  const handleSelectionChange = (levelIndex: number, value: string) => {
    if (!value) return;

    // Update the selected value for this level
    setDropdownLevels(prev => {
      const newLevels = [...prev];
      newLevels[levelIndex].selectedValue = value;
      // Remove all levels after this one
      return newLevels.slice(0, levelIndex + 1);
    });

    const currentLevel = dropdownLevels[levelIndex];
    const [type, id] = value.split(':');

    if (type === 'project') {
      // User selected a project
      const project = currentLevel.projects.find(p => p.id === parseInt(id));
      if (project && initialGroupId) {
        onProjectSelect(project, initialGroupId);
      }
    } else if (type === 'group') {
      // User selected a subgroup, load its content
      loadGroupContent(id, levelIndex + 1);
    }
  };

  const handleTeamGroupToggle = (levelIndex: number, checked: boolean) => {
    setDropdownLevels(prev => {
      const newLevels = [...prev];
      newLevels[levelIndex].isTeamGroup = checked;
      return newLevels;
    });
  };

  const handleSaveAsTeamGroup = (levelIndex: number) => {
    const level = dropdownLevels[levelIndex];
    if (!level.selectedValue || !onTeamGroupSelect) return;

    const [type, id] = level.selectedValue.split(':');
    if (type === 'group') {
      const group = level.groups.find(g => g.id === parseInt(id));
      if (group) {
        onTeamGroupSelect(group);
        
        // Mark this level as having saved a team group
        setDropdownLevels(prev => {
          const newLevels = [...prev];
          newLevels[levelIndex].teamGroupSaved = true;
          return newLevels;
        });
        
        // Set session flag to hide team group UI in future selections
        setTeamGroupSavedInSession(true);
      }
    }
  };

  const renderDropdown = (level: DropdownLevel, levelIndex: number) => {
    // Sort groups first, then projects
    const groupOptions = level.groups.map(group => ({
      value: `group:${group.id}`,
      label: group.name,
      type: 'group' as const,
      fullPath: group.full_path
    }));

    const projectOptions = level.projects.map(project => ({
      value: `project:${project.id}`,
      label: project.name,
      type: 'project' as const,
      fullPath: project.path_with_namespace
    }));

    const allOptions = [...groupOptions, ...projectOptions];

    return (
      <div key={`level-${levelIndex}`} className="mb-4">
        <Label>
          {levelIndex === 0 ? 'Select Group or Project' : `Subgroup/Project Selection - Level ${levelIndex + 1}`}
          {!level.loading && (
            <span className="text-xs text-gray-500 ml-2">
              ({level.groups.length} groups, {level.projects.length} projects)
            </span>
          )}
        </Label>
        <Select
          value={level.selectedValue}
          onChange={(e) => handleSelectionChange(levelIndex, e.target.value)}
          disabled={level.loading}
          className="font-mono text-sm"
        >
          <option value="">
            {level.loading ? '⏳ Loading groups and projects...' : 
             allOptions.length === 0 ? '-- No groups or projects found --' : 
             '-- Choose an option --'}
          </option>
          {allOptions.map(option => (
            <option key={option.value} value={option.value} className="font-mono">
              {option.label} <span style={{ color: '#888', fontSize: '0.85em' }}>({option.type})</span>
            </option>
          ))}
        </Select>
        {level.selectedValue && (
          <div className="mt-2 space-y-2">
            <p className="text-xs text-gray-500">
              Full path: {allOptions.find(opt => opt.value === level.selectedValue)?.fullPath}
            </p>
            
            {/* Team Group Selection UI */}
            {level.selectedValue.startsWith('group:') && onTeamGroupSelect && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
                {level.teamGroupSaved ? (
                  // Show saved state
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1 text-green-600 dark:text-green-400">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm font-medium">Saved as Team Group</span>
                    </div>
                  </div>
                ) : !teamGroupSavedInSession ? (
                  // Show team group selection UI only if no team group saved in this session
                  <>
                    <div className="flex items-center space-x-2 mb-2">
                      <Checkbox
                        id={`team-group-${levelIndex}`}
                        checked={level.isTeamGroup}
                        onChange={(e) => handleTeamGroupToggle(levelIndex, e.target.checked)}
                      />
                      <Label htmlFor={`team-group-${levelIndex}`} className="text-sm font-medium">
                        Use as Team Group for Epics
                      </Label>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                      Team groups are used to create and manage epics that can be linked to issues.
                    </p>
                    {level.isTeamGroup && (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleSaveAsTeamGroup(levelIndex)}
                      >
                        Save as Team Group
                      </Button>
                    )}
                    {!level.isTeamGroup && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleSaveAsTeamGroup(levelIndex)}
                      >
                        Save as Team Group
                      </Button>
                    )}
                  </>
                ) : (
                  // Show message that team group is already saved in this session
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Team group already saved in this session
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  if (!token) {
    return <p className="text-sm text-gray-500">Please login to GitLab first</p>;
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
        Navigate through groups and subgroups to find your project. Groups can be saved as team groups for epic management, and projects can be selected directly.
        {teamGroupSavedInSession && (
          <div className="mt-1 text-green-600 dark:text-green-400 text-xs">
            ✓ Team group saved in this session
          </div>
        )}
      </div>
      {dropdownLevels.map((level, index) => (
        <div key={`level-${index}`} className={`${index > 0 ? 'ml-4 pl-4 border-l-2 border-gray-200 dark:border-gray-700' : ''}`}>
          {renderDropdown(level, index)}
        </div>
      ))}
      {dropdownLevels.length > 0 && (
        <div className="text-xs text-gray-500 mt-2">
          💡 Tip: Select a group to see its subgroups and projects{!teamGroupSavedInSession && onTeamGroupSelect ? ', save a group as team group for epics,' : ''} or select a project to complete the selection.
        </div>
      )}
    </div>
  );
};

export default RecursiveGroupProjectSelector;