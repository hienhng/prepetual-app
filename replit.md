# QuizAI - AI-Powered Quiz Generator

## Overview

QuizAI is a full-stack web application that transforms study materials into interactive quizzes using AI. Users can upload documents (PDFs, images) to extract text via OCR, then generate custom quizzes with multiple question types (multiple choice, true/false, short answer). The app provides an interactive quiz-taking experience with detailed results and explanations.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: React Context API for quiz state, TanStack Query for server state
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens (CSS variables for theming)
- **Animations**: Framer Motion for page transitions and micro-interactions
- **Build Tool**: Vite with React plugin

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript (ESM modules)
- **API Design**: RESTful endpoints under `/api` prefix
- **File Handling**: Multer for multipart form uploads (10MB limit)
- **Text Extraction**: 
  - PDF parsing via pdf.js (`pdfjs-dist`)
  - OCR for images via Tesseract.js
- **AI Integration**: OpenAI-compatible API via Replit's AI Integrations service for quiz generation

### Data Layer
- **Schema Definition**: Drizzle ORM with PostgreSQL dialect
- **Validation**: Zod schemas with drizzle-zod integration
- **Current Storage**: In-memory storage (MemStorage class) - designed for easy migration to PostgreSQL
- **Data Models**: Users, Quizzes, Questions, QuizResults

### Key Design Patterns
- **Monorepo Structure**: Client (`client/`), Server (`server/`), Shared (`shared/`) directories
- **Path Aliases**: `@/` for client source, `@shared/` for shared modules
- **Type Safety**: Shared TypeScript types between frontend and backend via `shared/schema.ts`
- **Component Architecture**: Atomic design with UI primitives in `components/ui/`, feature components at top level

### Build & Development
- **Development**: Vite dev server with HMR, proxied through Express
- **Production**: Vite builds static assets to `dist/public`, esbuild bundles server to `dist/index.cjs`
- **Database Migrations**: Drizzle Kit for schema push (`npm run db:push`)

## External Dependencies

### AI Services
- **Replit AI Integrations**: OpenAI-compatible API for quiz question generation (configured via `AI_INTEGRATIONS_OPENAI_BASE_URL` and `AI_INTEGRATIONS_OPENAI_API_KEY` environment variables)

### Database
- **PostgreSQL**: Required for production (configured via `DATABASE_URL` environment variable)
- **Drizzle ORM**: Type-safe database queries and schema management

### Document Processing
- **pdf.js**: Server-side PDF text extraction
- **Tesseract.js**: OCR for image-based text extraction

### Third-Party Libraries
- **Radix UI**: Accessible component primitives (dialogs, dropdowns, forms, etc.)
- **TanStack Query**: Data fetching and caching
- **React Hook Form**: Form state management with Zod resolver
- **date-fns**: Date formatting utilities