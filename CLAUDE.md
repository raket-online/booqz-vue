# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Working Principles

1. First think through the problem, read the codebase for relevant files.
2. Before making any major changes, check in with the user to verify the plan.
3. At every step, provide a high-level explanation of what changes were made.
4. Make every task and code change as simple as possible. Avoid massive or complex changes. Every change should impact as little code as possible. Everything is about simplicity.
5. Maintain a documentation file that describes how the architecture of the app works inside and out.
6. Never speculate about code you have not opened. If the user references a specific file, read the file before answering. Investigate and read relevant files BEFORE answering questions about the codebase. Never make claims about code before investigating unless certain of the correct answer - give grounded and hallucination-free answers.

## Commands

```bash
npm install          # Install dependencies
npm run dev          # Start development server (http://localhost:5173)
npm run build        # Build for production
npm run preview      # Preview production build
```

## Architecture Overview

### Tech Stack
- Vue 3 + Composition API + TypeScript
- Vite (build tool)
- Tailwind CSS (styling)
- Pinia (state management)
- Vue Router (routing with auth guards)
- Supabase (Auth, Database, Storage)

### Project Structure
```
src/
├── components/layout/   # Sidebar, navbar components
├── composables/         # Reusable logic (useAuth)
├── config/              # App config (navigation items)
├── layouts/             # Page wrappers (AppLayout, AuthLayout)
├── lib/                 # External clients (supabase)
├── pages/               # Route components
│   └── auth/            # Login, Register
├── router/              # Routes + guards
└── stores/              # Pinia stores (auth, sidebar)
```

### Key Files

| File | Purpose |
|------|---------|
| `src/lib/supabase.ts` | Supabase client with env validation |
| `src/stores/auth.ts` | User/session state |
| `src/stores/sidebar.ts` | UI state (localStorage persisted) |
| `src/composables/useAuth.ts` | Auth methods |
| `src/router/index.ts` | Routes + auth guards |
| `src/config/navigation.ts` | Sidebar nav items |
| `src/App.vue` | Root component, layout switching |

### Auth Flow
1. `App.vue` → `useAuth().initialize()` on mount
2. Fetches session, sets up auth listener
3. Router guard waits for auth, checks `isAuthenticated`
4. `requiresAuth` routes → redirect to `/login` if not authenticated
5. `requiresGuest` routes → redirect to `/` if authenticated

### Layout System
Routes define layout via `meta.layout`:
```typescript
{ path: '/', meta: { layout: 'app', requiresAuth: true } }
{ path: '/login', meta: { layout: 'auth', requiresGuest: true } }
```
`App.vue` renders correct layout based on current route.

### State Management
- **auth store**: user, session, loading, isAuthenticated
- **sidebar store**: isCollapsed (synced to localStorage)

## Common Tasks

### Add New Page
1. Create `src/pages/NewPage.vue`
2. Add route in `src/router/index.ts`
3. Add nav item in `src/config/navigation.ts` (optional)

### Add New Store
```typescript
// src/stores/example.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useExampleStore = defineStore('example', () => {
  const items = ref([])
  return { items }
})
```

### Add New Composable
```typescript
// src/composables/useExample.ts
import { supabase } from '@/lib/supabase'

export function useExample() {
  async function fetchData() {
    const { data } = await supabase.from('table').select('*')
    return data
  }
  return { fetchData }
}
```

### Database Query
```typescript
import { supabase } from '@/lib/supabase'

const { data, error } = await supabase
  .from('table')
  .select('*')
  .eq('column', value)
```

### File Upload
```typescript
import { supabase } from '@/lib/supabase'

const { data, error } = await supabase.storage
  .from('bucket')
  .upload('path/file.png', file)
```

## Conventions

- Pages in `src/pages/`, nested by feature (`auth/Login.vue`)
- Composables start with `use` prefix
- Stores use Pinia setup syntax (Composition API)
- Routes use lazy loading: `() => import('@/pages/...')`
- All text in English for consistency
