# Ease GitLab

A productivity web application that streamlines working with GitLab projects and groups. Built with React, TypeScript, Vite, Tailwind CSS, and Zustand, it integrates the **GitBeaker** SDK and optional AI services (Google Gemini & OpenAI) to automate common GitLab workflows such as:

- **Issue Generator** – draft issues from plain-text prompts.
- **Epic Creator** – batch-create epics and issues for larger initiatives.
- **Milestone Report** – generate summaries for milestones via AI.
- **Label & Settings Panels** – quickly adjust project settings.

---

## Prerequisites

1. **Node ≥ 20** (or the version supported by your system)
2. **pnpm** – the package manager of choice for this project

```bash
npm i -g pnpm   # if you don't have it yet
```

---

## Getting Started

Clone the repo and install dependencies:

```bash
git clone https://github.com/omerzirh/ease-pm.git
cd ease-pm
pnpm install
```

Create a `.env` file (or export variables in your shell) with the following keys:

```env
# GitLab
VITE_GITLAB_HOST=https://gitlab.com                 # or your self-hosted URL
VITE_GITLAB_APPLICATION_ID=xxxxxxxxxxxxxxxxxxxx     # OAuth application ID
VITE_GITLAB_CALLBACK=http://localhost:5173/callback # OAuth redirect URI
VITE_GITLAB_PROJECT_ID=12345678                     # Default project (optional)
VITE_GITLAB_GROUP_ID=12345678                       # Default group   (optional)

# Logging configuration (optional)
VITE_LOG_LEVEL=debug        # error, warn, info, http, debug
VITE_MAX_LOGS=1000         # Maximum logs stored in browser (default: 500)

# AI (optional)
VITE_OPENAI_API_KEY=sk-...
VITE_GEMINI_API_KEY=AIza...
```

> ℹ️ Omit AI keys if you don’t plan to use the AI-powered features.

---

## Useful Commands

| Action               | Command           |
| -------------------- | ----------------- |
| Start dev server     | `pnpm dev`        |
| Build for production | `pnpm build`      |
| Preview production   | `pnpm preview`    |
| Lint & type-check    | `pnpm run lint` † |

† Add your own lint script if desired.

---

## Project Structure (excerpt)

```
src/
├─ components/          # React UI components
├─ services/            # API / AI helpers
├─ store/               # Zustand stores
├─ index.tsx            # App entry
├─ App.tsx              # Root component
└─ ...
```

---

## Contributing

We’re excited that you want to contribute to **Ease GitLab**!  
Bug fixes, new features, or documentation improvements — all contributions make the project better.

### 🚀 How to Contribute

1. **Fork the repository**  
   Click the **Fork** button on this repo to create your own copy.

2. **Clone your fork**

   ```bash
   git clone https://github.com/YOUR_USERNAME/ease-pm.git
   cd ease-pm
   ```

3. **Create a feature branch**  
   Work on a new branch for your changes:

   ```bash
   git checkout -b feat/your-feature-name
   # or
   git checkout -b fix/readme-install
   ```

4. **Make your changes**
   - Edit the necessary files
   - Test locally:
     ```bash
     pnpm dev
     ```

5. **Commit your changes**  
   Use clear and descriptive commit messages:

   ```bash
   git commit -m "feat: add contributor guidelines"
   ```

6. **Push to your fork**

   ```bash
   git push origin feat/your-feature-name
   ```

7. **Open a Pull Request (PR)**
   - Go to your fork on GitHub
   - Click **Compare & pull request**
   - Describe **what** you changed and **why**

---

### 📌 Guidelines

- Follow the existing code style (use ESLint: `pnpm run lint`)
- Add tests if you introduce new features
- Update the README if your changes affect documentation
- For questions or discussions, open an **Issue** first

---

## Logging

Ease GitLab includes a built-in browser-compatible logging system that helps with debugging and monitoring application behavior.

### Configuration

Add these optional environment variables to your `.env` file:

```env
# Logging configuration (optional)
VITE_LOG_LEVEL=debug        # error, warn, info, http, debug
VITE_MAX_LOGS=1000         # Maximum logs stored in browser (default: 500)
```

### Log Levels

| Level | Description | When to Use |
|-------|-------------|-------------|
| `error` | Critical failures | API errors, authentication failures |
| `warn` | Potential issues | Fallback behavior, deprecated features |
| `info` | Important events | User actions, successful operations |
| `http` | Network activity | API requests/responses |
| `debug` | Detailed tracing | Function calls, variable states |

### Environment Behavior

- **Development (`pnpm dev`)**: Shows all logs (debug level) by default
- **Production (`pnpm build`)**: Shows info, warn, and error logs only
- **Custom**: Override with `VITE_LOG_LEVEL` environment variable

### Usage Examples

```typescript
import { createLogger } from '../services/logger';

const log = createLogger('MyService');

// Basic logging
log.info('User logged in successfully');
log.error('Failed to save data');

// Logging with metadata
log.info('API call completed', { 
  endpoint: '/api/projects',
  duration: '245ms',
  status: 200 
});

// Error logging with stack traces
try {
  await api.createProject(data);
} catch (error) {
  log.error('Project creation failed', error); // Automatically extracts stack trace
}

// Complex metadata
log.debug('Processing user input', {
  userId: 123,
  action: 'create_issue',
  formData: { title: 'Bug fix', labels: ['bug', 'urgent'] }
});
```

### Viewing Logs

**Browser Console**: Open Developer Tools (F12) → Console tab to see colored, formatted logs

**Local Storage**: Access stored logs via Developer Tools → Application → Local Storage → `ease-pm-logs`

**Export Logs**: Use the exported utility functions:
```typescript
import { exportLogs, clearLogs } from './services/logger';

// Get all stored logs
const logs = exportLogs();

// Clear stored logs
clearLogs();
```

### Real Example from GitLab Service

```typescript
// From src/services/gitlabService.ts
export const gitlabService: GitLabService = {
  async fetchProjects(groupId) {
    log.info('Fetching projects', { groupId });
    
    try {
      log.debug('Attempting to fetch as group', { groupId });
      const projects = await api.Groups.projects(groupId);
      
      log.info('Successfully fetched projects via Groups API', { 
        groupId, 
        projectCount: projects.length 
      });
      
      return projects.map(p => ({ id: p.id, name: p.name, path_with_namespace: p.path_with_namespace }));
    } catch (error) {
      log.warn('Groups API failed, trying Users API', { 
        groupId, 
        error: error.message,
        status: error.response?.status 
      });
      
      // Fallback logic with additional logging...
    }
  }
};
```

This produces logs like:
```
[12/25/2025, 14:30:15] [INFO] [GitLabService]: Fetching projects
{
  "groupId": "my-username"
}

[12/25/2025, 14:30:16] [WARN] [GitLabService]: Groups API failed, trying Users API
{
  "groupId": "my-username",
  "error": "Request failed with status code 404",
  "status": 404
}
```

## License

This project is licensed under the MIT License — see `LICENSE` for details.
