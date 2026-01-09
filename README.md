# Vue.js App Boilerplate

A modern Vue.js boilerplate with Supabase authentication, Tailwind CSS styling, and a flexible sidebar layout.

## Tech Stack

- **Vue 3** - Composition API with TypeScript
- **Vite** - Fast development server and build tool
- **Tailwind CSS** - Utility-first CSS framework
- **Pinia** - State management
- **Vue Router** - Client-side routing with auth guards
- **Supabase** - Backend-as-a-Service (Auth, Database, Storage)

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Add your Supabase credentials to .env

# Start development server
npm run dev
```

## Supabase Setup

1. Create a new project on [supabase.com](https://supabase.com)
2. Copy the **Project URL** and **anon public key** from Settings > API
3. Add them to your `.env` file:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

### Google OAuth Setup

1. Go to Authentication > Providers in your Supabase dashboard
2. Enable Google
3. Create OAuth credentials in Google Cloud Console
4. Add redirect URI: `https://your-project.supabase.co/auth/v1/callback`

## Project Structure

```
src/
├── components/layout/    # Reusable layout components
├── composables/          # Vue composables (shared logic)
├── config/               # App configuration
├── layouts/              # Page layout wrappers
├── lib/                  # External service clients
├── pages/                # Route page components
├── router/               # Vue Router configuration
└── stores/               # Pinia state stores
```

## Features

- **Authentication** - Email/password and Google OAuth
- **Route Protection** - Auth guards with automatic redirects
- **Collapsible Sidebar** - Persistent state in localStorage
- **Route-based Layouts** - Clean separation via route meta
- **TypeScript** - Full type safety
- **Environment Validation** - Clear error messages

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run preview` | Preview build |

## Using Supabase

### Database Queries

```typescript
import { supabase } from '@/lib/supabase'

// Fetch data
const { data, error } = await supabase
  .from('posts')
  .select('*')
  .eq('user_id', userId)

// Insert data
const { error } = await supabase
  .from('posts')
  .insert({ title: 'Hello', user_id: userId })
```

### File Storage

```typescript
import { supabase } from '@/lib/supabase'

// Upload file
const { data, error } = await supabase.storage
  .from('avatars')
  .upload(`${userId}/avatar.png`, file)

// Get public URL
const { data } = supabase.storage
  .from('avatars')
  .getPublicUrl(`${userId}/avatar.png`)
```

## Extending the App

### Add a New Page

1. Create `src/pages/Dashboard.vue`
2. Add route in `src/router/index.ts`:
   ```typescript
   {
     path: '/dashboard',
     name: 'dashboard',
     component: () => import('@/pages/Dashboard.vue'),
     meta: { layout: 'app', requiresAuth: true }
   }
   ```
3. Add to navigation in `src/config/navigation.ts`

### Add a New Layout

1. Create `src/layouts/NewLayout.vue`
2. Import in `src/App.vue` and add to layout computed
3. Use via `meta: { layout: 'new' }` in routes

### Add a New Store

```typescript
// src/stores/posts.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const usePostsStore = defineStore('posts', () => {
  const posts = ref([])

  async function fetchPosts() {
    // ...
  }

  return { posts, fetchPosts }
})
```

## Troubleshooting

**"Missing Supabase environment variables"**
- Copy `.env.example` to `.env` and add your credentials

**Google OAuth not working**
- Check redirect URI in Supabase dashboard matches your domain
- Ensure Google provider is enabled in Supabase

**Styles not loading**
- Run `npm install` to ensure Tailwind is installed
- Check `src/style.css` has Tailwind directives
