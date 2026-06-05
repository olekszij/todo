# TaskFlow

TaskFlow is an interactive Kanban board for personal tasks and daily challenges. It helps you quickly capture work, move tasks through progress states, add random healthy challenges, and earn gems as you make progress.

## Features

- Three task columns: `Challenges`, `In Progress`, `Completed`.
- Add custom tasks through the input field.
- Generate random challenges with category, difficulty, estimated time, and XP.
- Drag and drop tasks between columns on desktop.
- Swipe gestures for task actions on mobile devices.
- Delete confirmation before removing a task.
- Gem rewards when moving a challenge into progress.
- Tasks, gems, and theme preference are saved in `localStorage`.
- Light and dark theme with manual switching.
- Interface animations powered by Framer Motion.

## Tech Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Framer Motion
- Lucide React
- Radix UI
- ESLint

## Getting Started

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

After startup, Vite will print the local app URL, usually `http://localhost:5173/`.

## Scripts

```bash
npm run dev
```

Starts the Vite development server.

```bash
npm run build
```

Checks the TypeScript project and builds the production version.

```bash
npm run lint
```

Runs ESLint for code checks.

```bash
npm run preview
```

Starts a local preview of the production build.

```bash
npm run test:all
```

Runs the available project tests.

## Project Structure

```text
src/
  components/
    KanbanBoard.tsx         # main board interface
    KanbanContext.tsx       # task state and task operations
    KanbanTypes.ts          # task types and localStorage key
    ThemeContext.tsx        # light/dark theme state
    DeleteConfirmation.tsx  # delete confirmation dialog
  lib/
    challenges.ts           # random challenge list
    utils.ts                # utility helpers
  App.tsx                   # providers and root layout
  main.tsx                  # React entry point
  index.css                 # Tailwind CSS and global styles
public/
  logo.png
  hero-img.png
  favicon.png
```

## Data Storage

The app works without a backend. Data is stored in the browser:

- `kanban-tasks` - task list.
- `userGems` - user's gem count.
- `theme` - selected theme.

To reset the app state, clear the site's browser data or remove these keys from `localStorage`.

## Build

Create a production build:

```bash
npm run build
```

The generated files will be placed in the `dist/` directory.
