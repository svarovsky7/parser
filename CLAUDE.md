# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Start development server (port 5173 by default)
npm run dev

# Build for production (TypeScript check + Vite build)
npm run build

# Run ESLint for code quality checks
npm run lint

# Preview production build locally
npm run preview
```

## Architecture

React + TypeScript application built with Vite, integrated with Supabase for backend services.

### Core Structure
- **Entry**: `src/main.tsx` renders App component to DOM
- **Supabase Client**: `src/lib/supabase.ts` - centralized client configuration
- **Data Hooks**: `src/hooks/useSupabase.ts` - CRUD operations for database entities
- **Type Definitions**: `src/types/supabase.ts` - database schema types
- **Main UI**: `src/App.tsx` - user management interface with connection status

### Build Configuration
- **Vite**: Fast HMR, ES modules, React plugin
- **TypeScript**: Strict mode, bundler module resolution, React JSX transform
- **ESLint**: TypeScript-ESLint + React Hooks plugins

## Supabase Setup

### Required Environment Variables
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Database Schema
**IMPORTANT**: The complete and authoritative database schema (tables, views, functions, triggers, policies) is defined in `supabase/schemes/prod.sql`. This file contains the full production database structure exported from Supabase.

Always refer to `supabase/schemes/prod.sql` for:
- Current table structures
- Indexes and constraints
- Functions and triggers
- RLS policies
- Any database modifications

See `README_SUPABASE.md` for initial setup instructions and troubleshooting.

### Data Operations Pattern
The `useUsers()` hook in `src/hooks/useSupabase.ts` provides:
- Automatic data fetching on mount
- CRUD operations with optimistic updates
- Error handling and loading states
- Type-safe operations via generated types

When adding new tables:
1. Create table in Supabase Dashboard
2. Update types in `src/types/supabase.ts`
3. Create corresponding hook in `src/hooks/`
4. Follow existing patterns for state management

## Key Dependencies

- **@supabase/supabase-js**: ^2.55.0 - Supabase client
- **react**: ^19.1.1 - UI library
- **typescript**: ~5.8.3 - Type safety
- **vite**: ^7.1.2 - Build tool
- **eslint**: ^9.33.0 - Code quality