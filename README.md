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
git clone https://github.com/your-org/ease-gitlab.git
cd ease-gitlab
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

# AI (optional)
VITE_OPENAI_API_KEY=sk-...
VITE_GEMINI_API_KEY=AIza...
```

> ℹ️  Omit AI keys if you don’t plan to use the AI-powered features.

---

## Useful Commands

| Action                | Command           |
|-----------------------|-------------------|
| Start dev server      | `pnpm dev`        |
| Build for production  | `pnpm build`      |
| Preview production    | `pnpm preview`    |
| Lint & type-check     | `pnpm run lint` † |

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

1. Create a feature branch: `git checkout -b feat/awesome`  
2. Commit your changes: `git commit -m "feat: awesome"`  
3. Push to the branch: `git push origin feat/awesome`  
4. Open a Merge Request in GitLab

---

## License

This project is licensed under the MIT License — see `LICENSE` for details.
