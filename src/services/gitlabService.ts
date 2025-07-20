import { Gitlab } from '@gitbeaker/browser';
import { useGitlabAuth } from '../store/useGitlabAuth';

const getApi = () => {
  const { api } = useGitlabAuth.getState();
  if (!api) {
    throw new Error('Not authenticated with GitLab');
  }
  return api as InstanceType<typeof Gitlab>;
};

export interface GitLabService {
  fetchProjects(groupId: string | number): Promise<Array<{ id: number; name: string; path_with_namespace: string }>>;
  fetchLabels(projectId: string | number): Promise<Array<{ id: number; name: string; description: string }>>;
  fetchMilestones(projectId: string | number): Promise<Array<{ id: number; title: string; description: string }>>;
  fetchGroupMilestones(groupId: string | number): Promise<Array<{ id: number; title: string; description: string }>>;
  fetchIssuesByMilestone(projectId: string | number, milestone: string): Promise<Array<{ id: number; iid: number; title: string; web_url: string; state: string }>>;
  createIssue(
    projectId: string | number,
    title: string,
    description: string,
    labels: string[],
    milestoneId?: number
  ): Promise<{ id: number; iid: number; web_url: string }>;
  createEpic(
    groupId: string | number,
    title: string,
    description: string,
    labels: string[],
    parentId?: number,
    enableEpic?: boolean
  ): Promise<{ id: number; iid: number; web_url: string }>;
  linkIssues(
    projectId: string | number,
    sourceIid: number,
    targetIid: number,
  ): Promise<any>;
  fetchIssueLinks(projectId: string | number, issueIid: number): Promise<number[]>;
  searchEpics(groupId: string | number, query: string): Promise<Array<{ id: number; iid: number; title: string; web_url: string }>>;
  addIssueToEpic(groupId: string | number, epicIid: number, projectId: number | string, issueIid: number): Promise<void>;
}

export const gitlabService: GitLabService = {
  async fetchProjects(groupId) {
    const api = getApi();
    const projects = await api.Groups.projects(groupId);
    return projects.map((p: any) => ({ id: p.id, name: p.name, path_with_namespace: p.path_with_namespace }));
  },
  async fetchLabels(projectId) {
    const api = getApi();
    const labels = await api.Labels.all(projectId);
    return labels.map(label => ({
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
    const epic = await api.Epics.create(groupId,title,epicData)
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
    return milestones.map(milestone => ({
      id: (milestone as any).id,
      title: (milestone as any).title,
      description: (milestone as any).description || '',
    }));
  },

  async fetchGroupMilestones(groupId) {
    const api = getApi();
    const milestones = await api.GroupMilestones.all(groupId);
    return milestones.map(milestone => ({
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

    return issues.map(issue => ({
      id: (issue as any).id,
      iid: (issue as any).iid,
      title: (issue as any).title,
      web_url: (issue as any).web_url,
      state: (issue as any).state,
    }));
  },

  async createIssue(projectId, title, description, labels = [], milestoneId) {
    const issueData: any = {
      title,
      description,
      labels: labels.join(','),
    };

    if (milestoneId) {
      issueData.milestone_id = milestoneId;
    }

    const api = getApi();
    const issue = await api.Issues.create(projectId, issueData);

    return {
      id: (issue as any).id,
      iid: (issue as any).iid,
      web_url: (issue as any).web_url,
    };
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

  async  fetchIssueLinks(projectId: string | number, issueIid: number) {
   
    try {
      const api = getApi();
    const result = await api.Issues.links(projectId,issueIid);
      return result.map((l: any) => l.iid as number);
    } catch (error: any) {
      throw new Error(`Failed to fetch issue links: ${error.message}`);
    }
  },
};

export default gitlabService;
