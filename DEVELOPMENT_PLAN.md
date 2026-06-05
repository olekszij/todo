# ChallengeBoard v2 Development Plan

## Project Goal

Upgrade the existing React challenge board into a full-stack portfolio project: a gamified productivity platform with authentication, PostgreSQL persistence, drag-and-drop Kanban workflow, achievements, statistics, and real deployment.

## Target Result

ChallengeBoard v2 should become a production-ready full-stack app with:

- React frontend with the current visual style preserved and expanded.
- Node.js backend using Express or NestJS.
- PostgreSQL database managed through Prisma.
- JWT authentication.
- User-specific challenges and statistics.
- Automatic achievement unlocking.
- Railway-ready backend and database deployment.
- Netlify or Vercel frontend deployment.
- Portfolio-ready README, screenshots, and live demo links.

## Phase 1: Current Project Analysis

### Goals

- Understand the existing React application structure.
- Identify reusable components and logic.
- Document what must be replaced when backend persistence is added.

### Tasks

- Review the current folder structure.
- Detect current state management patterns.
- Check how tasks and challenges are stored.
- Identify reusable UI components.
- Identify logic currently tied to `localStorage`.
- Review the current challenge model and map it to the new database model.

### Current Observations

- The app is a Vite + React + TypeScript frontend.
- Main board UI lives in `src/components/KanbanBoard.tsx`.
- Task state is managed through `src/components/KanbanContext.tsx`.
- Task data is currently persisted in browser `localStorage`.
- Challenge templates are stored in `src/lib/challenges.ts`.
- Theme state is handled by `src/components/ThemeContext.tsx`.
- The current UI, columns, task cards, drag behavior, swipe behavior, and theme toggle can be reused.

## Phase 2: Backend Foundation

### Recommended Stack

- Node.js
- Express for a lightweight backend, or NestJS for a more structured portfolio-grade API
- PostgreSQL
- Prisma ORM
- JWT authentication
- Railway deployment

### Backend Folder Structure

```text
server/
  prisma/
    schema.prisma
    seed.ts
  src/
    config/
    middleware/
    modules/
      auth/
      users/
      challenges/
      categories/
      achievements/
      stats/
    utils/
    app.ts
    server.ts
  package.json
  tsconfig.json
  .env.example
```

### Environment Variables

```env
DATABASE_URL="postgresql://..."
JWT_SECRET="replace-with-secure-secret"
JWT_EXPIRES_IN="15m"
PORT=4000
CLIENT_URL="http://localhost:5173"
```

## Phase 3: Database Schema

### Entities

- User
- Challenge
- Category
- Achievement
- UserAchievement
- UserStats

### Challenge Status

```text
TODO
IN_PROGRESS
COMPLETED
```

### Prisma Schema Draft

```prisma
model User {
  id           String            @id @default(cuid())
  email        String            @unique
  passwordHash String
  name         String?
  challenges   Challenge[]
  stats        UserStats?
  achievements UserAchievement[]
  createdAt    DateTime          @default(now())
  updatedAt    DateTime          @updatedAt
}

model Challenge {
  id          String          @id @default(cuid())
  title       String
  description String?
  difficulty  Difficulty
  duration    String?
  gems        Int             @default(0)
  status      ChallengeStatus @default(TODO)
  userId      String
  categoryId  String?
  user        User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  category    Category?       @relation(fields: [categoryId], references: [id])
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt
}

model Category {
  id         String      @id @default(cuid())
  name       String      @unique
  challenges Challenge[]
  createdAt  DateTime    @default(now())
}

model Achievement {
  id          String            @id @default(cuid())
  code        String            @unique
  title       String
  description String
  condition   String
  users       UserAchievement[]
  createdAt   DateTime          @default(now())
}

model UserAchievement {
  id            String      @id @default(cuid())
  userId        String
  achievementId String
  unlockedAt    DateTime    @default(now())
  user          User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  achievement   Achievement @relation(fields: [achievementId], references: [id], onDelete: Cascade)

  @@unique([userId, achievementId])
}

model UserStats {
  id                  String   @id @default(cuid())
  userId              String   @unique
  totalCompleted      Int      @default(0)
  totalGems           Int      @default(0)
  currentStreak       Int      @default(0)
  longestStreak       Int      @default(0)
  completedThisWeek   Int      @default(0)
  lastCompletionDate  DateTime?
  user                User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  updatedAt           DateTime @updatedAt
}

enum Difficulty {
  easy
  medium
  hard
}

enum ChallengeStatus {
  TODO
  IN_PROGRESS
  COMPLETED
}
```

## Phase 4: Authentication

### Features

- User registration.
- User login.
- Password hashing with bcrypt.
- JWT access token.
- Protected backend routes.
- Frontend auth state.
- User-specific challenge data.

### API Routes

```text
POST /auth/register
POST /auth/login
GET  /auth/me
```

### Auth Flow

- User registers with email, password, and optional name.
- Backend stores a hashed password.
- Backend returns a JWT access token.
- Frontend stores the token.
- Protected API requests send `Authorization: Bearer <token>`.
- Backend middleware verifies token and attaches `userId` to the request.

## Phase 5: Challenge API

### Challenge Fields

```text
id
title
description
difficulty
category
duration
gems
status: TODO | IN_PROGRESS | COMPLETED
userId
createdAt
updatedAt
```

### API Routes

```text
GET    /challenges
POST   /challenges
PATCH  /challenges/:id
DELETE /challenges/:id
PATCH  /challenges/:id/status
```

### Behavior

- `GET /challenges` returns only challenges owned by the authenticated user.
- `POST /challenges` creates a challenge for the authenticated user.
- `PATCH /challenges/:id` updates editable challenge fields.
- `DELETE /challenges/:id` deletes only the user's own challenge.
- `PATCH /challenges/:id/status` updates Kanban status and triggers stats and achievement checks.

## Phase 6: Replace Local State and localStorage

### Goals

- Move task persistence from browser `localStorage` to PostgreSQL.
- Keep the current UI interactions where possible.

### Tasks

- Replace `KanbanContext` persistence logic with API calls.
- Add API client helpers.
- Add loading states while challenges are fetched.
- Add optimistic updates for drag-and-drop if desired.
- Handle API errors and rollback failed status changes.
- Keep `localStorage` only for non-critical preferences such as theme, unless auth strategy requires token storage.

### Frontend Data Flow

```text
React UI
  -> API client
  -> Express/NestJS backend
  -> Prisma
  -> PostgreSQL
```

## Phase 7: Drag and Drop Persistence

### Goals

- Keep moving cards between:
  - Challenges
  - In Progress
  - Completed
- Persist every status change in the database.

### Tasks

- Map frontend columns to backend statuses:
  - `Challenges` -> `TODO`
  - `In Progress` -> `IN_PROGRESS`
  - `Completed` -> `COMPLETED`
- On drop, call `PATCH /challenges/:id/status`.
- Update UI after successful response.
- Show error state if the database update fails.
- Recalculate statistics when a challenge becomes `COMPLETED`.

## Phase 8: User Statistics

### Dashboard Metrics

- Total completed challenges.
- Total gems.
- Current streak.
- Challenges by category.
- Completed this week.

### API Routes

```text
GET /stats
```

### Tasks

- Create `UserStats` row after registration.
- Update stats when a challenge is completed.
- Add a dashboard page to display stats.
- Add category breakdown visualization.
- Add weekly completion count.

## Phase 9: Achievements

### Achievement Examples

- First Challenge Completed
- 100 Gems Earned
- 7 Day Streak
- Completed 10 Challenges

### API Routes

```text
GET /achievements
GET /achievements/unlocked
```

### Unlock Rules

- Unlock `First Challenge Completed` when `totalCompleted >= 1`.
- Unlock `100 Gems Earned` when `totalGems >= 100`.
- Unlock `7 Day Streak` when `currentStreak >= 7`.
- Unlock `Completed 10 Challenges` when `totalCompleted >= 10`.

### Tasks

- Seed achievement definitions.
- Create achievement evaluation service.
- Run achievement checks after status changes.
- Prevent duplicate unlocks with a unique user-achievement relation.
- Show unlocked achievements on dashboard and profile pages.

## Phase 10: UI Improvements

### Keep

- Current visual style.
- Kanban board layout.
- Theme switching.
- Challenge cards.
- Drag-and-drop workflow.
- Mobile swipe interactions if they remain compatible with the new state flow.

### Add

- Login page.
- Register page.
- Dashboard page.
- Profile page.
- Loading states.
- Error states.
- Empty states.
- Authenticated app layout.
- Navigation between board, dashboard, and profile.

### Frontend Routes

```text
/login
/register
/board
/dashboard
/profile
```

## Phase 11: Portfolio README

The final README should include:

- Project description.
- Live demo link.
- Screenshots.
- Tech stack.
- Features.
- Database schema.
- API routes.
- How to run locally.
- Environment variables.
- Deployment notes.
- Portfolio description explaining the engineering value of the project.

### Portfolio Description Draft

ChallengeBoard v2 is a full-stack gamified productivity platform built with React, Node.js, PostgreSQL, Prisma, and JWT authentication. It demonstrates user-specific data, protected APIs, relational database modeling, drag-and-drop interactions, statistics, achievements, and real-world deployment across separate frontend, backend, and database services.

## Phase 12: Deployment

### Frontend

- Deploy on Netlify or Vercel.
- Set backend API URL as an environment variable.
- Configure redirects for client-side routing if needed.

### Backend

- Deploy on Railway.
- Add production environment variables.
- Run Prisma migrations during deployment.
- Enable CORS for the frontend domain.

### Database

- Use PostgreSQL on Railway.
- Connect backend with `DATABASE_URL`.
- Run initial migrations.
- Seed categories and achievements.

## Suggested Implementation Order

1. Analyze and document current app structure.
2. Create backend project.
3. Configure Prisma and PostgreSQL.
4. Implement auth.
5. Implement challenge CRUD API.
6. Connect frontend auth flow.
7. Replace local challenge storage with API data.
8. Persist drag-and-drop status updates.
9. Add stats calculation.
10. Add achievements.
11. Add dashboard and profile pages.
12. Improve loading, error, and empty states.
13. Update README with screenshots and API docs.
14. Deploy backend and database to Railway.
15. Deploy frontend to Netlify or Vercel.
16. Add live demo links to README.

## Definition of Done

- Users can register and log in.
- Authenticated users can manage only their own challenges.
- Challenges are stored in PostgreSQL.
- Drag-and-drop updates challenge status in the database.
- Dashboard displays real user statistics.
- Achievements unlock automatically.
- UI includes board, dashboard, profile, login, and register pages.
- App has loading, error, and empty states.
- Frontend and backend are deployed.
- README includes screenshots, schema, API routes, setup instructions, and live demo links.
