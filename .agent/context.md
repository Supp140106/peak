# Peak AI Agent Context Guide

This directory (`.agent`) is intended to store context, instructions, and architectural guidelines for AI agents working on the Peak codebase.

## Peak — Premium Habit Tracker

**Goal:** A world-class, Claude-aesthetic habit tracking desktop application built with Tauri v2. It should be calm, minimal, elegant, and fast.

### Tech Stack
*   **Frontend:** React 19, TypeScript, TailwindCSS 4, Framer Motion, Zustand, React Router v7, Lucide Icons
*   **Backend:** Tauri v2 (Rust)
*   **Database:** SQLite (via `@tauri-apps/plugin-sql`)
*   **Build Tool:** Vite 7, Bun

### Design Language & UI Style (Claude-inspired)
*   **Colors:** Warm white/graphite backgrounds, terracotta/amber accents, soft grays.
*   **Typography:** Inter font, clean headings, professional spacing.
*   **UX:** Smooth animations (Framer Motion), soft rounded corners, glassmorphism, no distractions.
*   **Components:** We use a customized shadcn/ui approach. Base components are in `src/components/ui/` (e.g., `Button.tsx`, `Card.tsx`, `Input.tsx`, `Textarea.tsx`, `Badge.tsx`). These are styled strictly using our custom CSS variables, NOT standard Tailwind colors.
*   **Design Tokens (from `src/styles/index.css`):**
    *   Backgrounds: `--color-bg-primary`, `--color-bg-secondary` (cards), `--color-bg-tertiary` (subtle sections), `--color-bg-hover`.
    *   Text: `--color-text-primary`, `--color-text-secondary`, `--color-text-tertiary`.
    *   Accents: `--color-accent`, `--color-accent-hover`, `--color-accent-light`.
    *   Borders: `--color-border`, `--color-border-focus`.
    *   Utility classes: `.glass`, `.card-shadow`, `.card-shadow-hover`.
*   **Aesthetics Rule:** Avoid generic dashboard designs. Ensure large paddings, minimalistic borders, and subtle hover states. Use `lucide-react` for all icons.
3.  **Database:** All database interactions must go through the typed wrappers in `src/database/*.ts`. Do not write raw SQL queries directly in components or stores.
4.  **State Management:** Global state goes in `src/store/*` using Zustand. Local UI state stays in React components.
5.  **Offline First:** The app uses a local SQLite database. Do NOT add any cloud sync or network requests unless explicitly requested.

### Current Architecture State
*   Phase 1 (Foundation) & Phase 2 (Core Habits) are implemented.
*   Database schema is fully defined in `src/database/connection.ts`.
*   Zustand stores are set up for settings and habits.
*   Theming is handled via custom CSS properties and a `dark` class on the `html` element.

See `implementation_plan.md` in the user's `.gemini` artifacts directory for the full roadmap.
