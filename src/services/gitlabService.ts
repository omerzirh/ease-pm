import { Gitlab } from '@gitbeaker/browser';
import { useGitlabAuth } from '../store/useGitlabAuth';
import { useSettingsStore } from '../store/useSettingsStore';
import {createLogger} from './logger';

const log = createLogger('GitLabService');

const getGitlabHost = () =>
  useSettingsStore.getState().gitlabHost || import.meta.env.VITE_GITLAB_HOST || 'https://gitlab.com';

const getApi = () => {
  log.info('Getting GitLab API instance');
  const { api } = useGitlabAuth.getState();
  if (!api) {
    log.error('Not authenticated with GitLab');
    throw new Error('Not authenticated with GitLab');
  }
  log.debug('Successfully retrieved GitLab API instance');
  return api as InstanceType<typeof Gitlab>;
};

const getToken = () => {
  const { token } = useGitlabAuth.getState();
  if (!token) {
    throw new Error('Not authenticated with GitLab');
  }
  return token;
};

export interface Iteration {
  id: number;
  iid: number;
  title: string;
  description: string;
  state: number;
  start_date: string;
  due_date: string;
  web_url: string;
}

export interface IterationOptions {
  state?: 'opened' | 'current' | 'closed';
  search?: string;
  includeAncestors?: boolean;
  includeDescendants?: boolean;
  updatedBefore?: string;
  updatedAfter?: string;
}

export interface GitlabGroup {
  id: number;
  name: string;
  path: string;
  full_path: string;
}

export interface GitlabProject {
  id: number;
  name: string;
  path_with_namespace: string;
}

export interface GroupContent {
  groups: GitlabGroup[];
  projects: GitlabProject[];
}

export interface GitLabService {
  fetchProjects(groupId: string | number): Promise<Array<{ id: number; name: string; path_with_namespace: string }>>;
  fetchGroupContent(groupId: string | number): Promise<GroupContent>;
  fetchLabels(projectId: string | number): Promise<Array<{ id: number; name: string; description: string }>>;
  fetchMilestones(projectId: string | number): Promise<Array<{ id: number; title: string; description: string }>>;
  fetchGroupMilestones(groupId: string | number): Promise<Array<{ id: number; title: string; description: string }>>;
  fetchIssuesByMilestone(
    projectId: string | number,
    milestone: string
  ): Promise<Array<{ id: number; iid: number; title: string; web_url: string; state: string }>>;
  fetchProjectIterations(projectId: string | number, options?: IterationOptions): Promise<Iteration[]>;
  fetchIterations(groupId: string | number, state?: string): Promise<Iteration[]>;
  fetchIssuesByIteration(
    projectId: string | number,
    iterationId: number
  ): Promise<Array<{ id: number; iid: number; title: string; web_url: string; state: string; labels: string[] }>>;
  createIssue(
    projectId: string | number,
    title: string,
    description: string,
    labels: string[],
    milestoneId?: number,
    iterationId?: number
  ): Promise<{ id: number; iid: number; web_url: string }>;
  updateIssue(
    projectId: string | number,
    issueIid: number,
    updates: { title?: string; description?: string; labels?: string[] }
  ): Promise<void>;
  createEpic(
    groupId: string | number,
    title: string,
    description: string,
    labels: string[],
    parentId?: number,
    enableEpic?: boolean
  ): Promise<{ id: number; iid: number; web_url: string }>;
  linkIssues(projectId: string | number, sourceIid: number, targetIid: number): Promise<any>;
  fetchIssueLinks(projectId: string | number, issueIid: number): Promise<number[]>;
  searchEpics(
    groupId: string | number,
    query: string
  ): Promise<Array<{ id: number; iid: number; title: string; web_url: string }>>;
  addIssueToEpic(
    groupId: string | number,
    epicIid: number,
    projectId: number | string,
    issueIid: number
  ): Promise<void>;
  getHostUrl(): string;
}

export const gitlabService: GitLabService = {
  async fetchProjects(groupId) {
    const api = getApi();
    const projects = await api.Groups.projects(groupId);
    return projects.map((p: any) => ({ id: p.id, name: p.name, path_with_namespace: p.path_with_namespace }));
  },

  async fetchGroupContent(groupId) {
    const api = getApi();
    
    // Fetch subgroups
    const subgroups = await api.Groups.subgroups(groupId);
    const groups = subgroups.map((g: any) => ({
      id: g.id,
      name: g.name,
      path: g.path,
      full_path: g.full_path,
    }));

    // Fetch projects
    const projects = await api.Groups.projects(groupId);
    const projectList = projects.map((p: any) => ({
      id: p.id,
      name: p.name,
      path_with_namespace: p.path_with_namespace,
    }));

    return { groups, projects: projectList };
  },
  async fetchLabels(projectId) {
    const api = getApi();
    const labels = await api.Labels.all(projectId);
    return labels.map((label) => ({
      id: (label as any).id,
      name: (label as any).name,
      description: (label as any).description || '',
    }));
  },

  async createEpic(groupId, title, description, labels = [], parentId, enableEpic) {
    const epicData: any = {
      title,
      description,
      labels: labels.join(','),
    };
    if (parentId && enableEpic) epicData.parent_id = parentId;
    const api = getApi();
    const epic = await api.Epics.create(groupId, title, epicData);
    return { id: (epic as any).id, iid: (epic as any).iid, web_url: (epic as any).web_url };
  },

  async addIssueToEpic(groupId, epicIid, projectId, issueIid) {
    try {
      const api = getApi();
      await api.EpicIssues.assign(groupId, epicIid, issueIid);
    } catch (error: any) {
      throw new Error(`Failed to add issue to epic: ${error.message}`);
    }
  },

  async searchEpics(groupId, query) {
    const api = getApi();
    const epics = await api.Epics.all(groupId, { search: query, per_page: 20 });
    return epics.map((e: any) => ({ id: e.id, iid: e.iid, title: e.title, web_url: e.web_url }));
  },

  async fetchMilestones(projectId) {
    const api = getApi();
    const milestones = await api.ProjectMilestones.all(projectId);
    return milestones.map((milestone) => ({
      id: (milestone as any).id,
      title: (milestone as any).title,
      description: (milestone as any).description || '',
    }));
  },

  async fetchGroupMilestones(groupId) {
    const api = getApi();
    const milestones = await api.GroupMilestones.all(groupId);
    return milestones.map((milestone) => ({
      id: (milestone as any).id,
      title: (milestone as any).title,
      description: (milestone as any).description || '',
    }));
  },

  async fetchIssuesByMilestone(projectId, milestone) {
    const api = getApi();
    const issues = await api.Issues.all({
      projectId,
      milestone,
      state: 'opened',
      per_page: 100,
    });

    return issues.map((issue) => ({
      id: (issue as any).id,
      iid: (issue as any).iid,
      title: (issue as any).title,
      web_url: (issue as any).web_url,
      state: (issue as any).state,
    }));
  },

  async fetchProjectIterations(projectId, options = {}) {
    const token = getToken();
    const params = new URLSearchParams();

    if (options.state) params.append('state', options.state);
    if (options.search) params.append('search', options.search);
    if (options.includeAncestors !== undefined) params.append('include_ancestors', options.includeAncestors.toString());
    if (options.includeDescendants !== undefined)
      params.append('include_descendants', options.includeDescendants.toString());
    if (options.updatedBefore) params.append('updated_before', options.updatedBefore);
    if (options.updatedAfter) params.append('updated_after', options.updatedAfter);

    const url = `${getGitlabHost()}/api/v4/projects/${projectId}/iterations${params.toString() ? '?' + params.toString() : ''}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch project iterations: ${response.statusText}`);
    }

    const iterations = await response.json();

    return iterations.map((iteration: any) => ({
      id: iteration.id,
      iid: iteration.iid,
      title: iteration.title,
      description: iteration.description || '',
      state: iteration.state,
      start_date: iteration.start_date,
      due_date: iteration.due_date,
      web_url: iteration.web_url,
    }));
  },

  async fetchIterations(groupId, state = 'opened') {
    const token = getToken();
    const url = `${getGitlabHost()}/api/v4/groups/${groupId}/iterations?state=${state}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch group iterations: ${response.statusText}`);
    }

    const iterations = await response.json();

    return iterations.map((iteration: any) => ({
      id: iteration.id,
      iid: iteration.iid,
      title: iteration.title,
      description: iteration.description || '',
      state: iteration.state,
      start_date: iteration.start_date,
      due_date: iteration.due_date,
      web_url: iteration.web_url,
    }));
  },

  async fetchIssuesByIteration(projectId, iterationId) {
    const api = getApi();
    const issues = await api.Issues.all({
      projectId,
      iteration_id: iterationId,
      per_page: 100,
    });

    return issues.map((issue) => ({
      id: (issue as any).id,
      iid: (issue as any).iid,
      title: (issue as any).title,
      web_url: (issue as any).web_url,
      state: (issue as any).state,
      labels: (issue as any).labels || [],
    }));
  },

  async createIssue(projectId, title, description, labels = [], milestoneId, iterationId) {
    const issueData: any = {
      title,
      description,
      labels: labels.join(','),
    };

    if (milestoneId) {
      issueData.milestone_id = milestoneId;
    }

    if (iterationId) {
      issueData.iteration_id = iterationId;
    }

    const api = getApi();
    const issue = await api.Issues.create(projectId, issueData);

    return {
      id: (issue as any).id,
      iid: (issue as any).iid,
      web_url: (issue as any).web_url,
    };
  },

  async updateIssue(projectId, issueIid, updates) {
    const api = getApi();
    const updateData: any = {};

    if (updates.title) updateData.title = updates.title;
    if (updates.description) updateData.description = updates.description;
    if (updates.labels) updateData.labels = updates.labels.join(',');

    await api.Issues.edit(projectId, issueIid, updateData);
  },

  async linkIssues(projectId: string | number, sourceIid: number, targetIid: number) {
    try {
      const api = getApi();
      const result = await api.Issues.link(projectId, sourceIid, projectId, targetIid);
      return result;
    } catch (error: any) {
      throw new Error(`Failed to link issue #${targetIid} to #${sourceIid}: ${error.message}`);
    }
  },

  async fetchIssueLinks(projectId: string | number, issueIid: number) {
    try {
      const api = getApi();
      const result = await api.Issues.links(projectId, issueIid);
      return result.map((l: any) => l.iid as number);
    } catch (error: any) {
      throw new Error(`Failed to fetch issue links: ${error.message}`);
    }
  },

  getHostUrl() {
    return getGitlabHost();
  },
};

export default gitlabService;
