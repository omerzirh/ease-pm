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

## License

This project is licensed under the MIT License — see `LICENSE` for details.
