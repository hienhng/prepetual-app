# Prepetual

Prepetual is an AI-powered study app that turns notes, documents, images, and YouTube transcripts into quizzes and guided study sessions. Generate practice questions, import an existing exam, review explanations, and track your learning progress in one place.

## Features

- **Create quizzes from study material.** Paste text or upload PDFs, Word documents, PowerPoint presentations, Excel spreadsheets, and PNG/JPEG images. Choose multiple-choice, multiple-selection, true/false, or short-answer questions.
- **Import existing exams.** Convert worksheets and exam scans into editable quizzes, with image transcription and answer verification.
- **Study with AI.** Generate summaries and lecture slides, ask questions about a quiz, and revisit mistakes with targeted review.
- **Use video transcripts.** Turn a YouTube video's available transcript into study material.
- **Save and organize your work.** Group quizzes into folders, resume saved quiz progress, view attempt history, and recover incomplete quiz generation from saved drafts.
- **Share and discover quizzes.** Share quiz links, browse the public feed, comment, vote, and export quizzes to PDF.
- **Personalize the experience.** English and Vietnamese interfaces, light and dark themes, and configurable study preferences.

Uploads report background processing progress, and quiz generation streams progress through Server-Sent Events (SSE). Image processing combines AI transcription with English and Vietnamese OCR.

## Technology

| Layer | Main technologies |
| --- | --- |
| Frontend | React 18, TypeScript, Vite, Wouter, TanStack Query |
| Interface | Tailwind CSS, Radix UI, Framer Motion, Lucide icons |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL, pgvector, Drizzle ORM |
| AI | OpenAI SDK with configurable OpenAI-compatible providers; separate embedding configuration for source retrieval |
| Document processing | PDF.js, pdf-parse, officeparser, Tesseract.js, native canvas |
| Authentication | Email/password with bcrypt, Google ID-token verification, PostgreSQL-backed sessions |
| Email | Nodemailer with Gmail transport |
| Mobile | Capacitor with an Android project |

## Run locally

### Requirements

- **Node.js 22.13.0 or newer** and npm, as specified in `package.json`.
- A PostgreSQL database with **pgvector available** and a database user allowed to enable the `vector` extension.
- An API key for an OpenAI-compatible chat provider. The example configuration uses Groq.
- An embedding provider for source retrieval, configured to return **1,536-dimensional vectors**.

### 1. Install dependencies

From the repository root:

```sh
npm ci
```

### 2. Configure the environment

Copy the example configuration:

```sh
cp .env.example .env
```

On PowerShell:

```powershell
Copy-Item .env.example .env
```

Edit `.env` before starting the app:

- Set `DATABASE_URL` to your database connection string.
- Replace `SESSION_SECRET` with a random secret. Production requires at least 32 characters.
- Set `APP_URL=http://localhost:5000` for local password-reset links.
- Set the chat and embedding API credentials, endpoints, and model IDs for your providers. Model IDs must match the chosen endpoint.
- Add `GEMINI_API_KEY`, or supply the SDK's `OPENAI_API_KEY` fallback, as described below.
- Configure Gmail credentials, or remove both Gmail placeholder values to use development email logging.
- Remove optional placeholder credentials for integrations you are not using.

**Current startup requirement:** `server/openai.ts` initializes a Gemini SDK client when the module loads, even though that client is currently unused. The SDK requires `GEMINI_API_KEY` or its `OPENAI_API_KEY` fallback to be defined. This setting is missing from `.env.example`; setting only the main chat API key does not satisfy it.

### 3. Initialize the database

Create the database referenced by `DATABASE_URL`, then run:

```sh
npm run db:push
```

This command enables the `vector` extension and pushes the schema in `shared/schema.ts`. The PostgreSQL server must already have pgvector installed. If your database user cannot create extensions, have the database administrator enable `vector` first.

For an existing database that only needs the generation-draft migrations:

```sh
npm run db:generation-drafts
```

That command applies the two generation-draft SQL migrations; it does not initialize the rest of the schema.

### 4. Start development

```sh
npm run dev
```

Open [localhost:5000](http://localhost:5000). Express serves both the API and the Vite development frontend. Set `PORT` in `.env` to change the port, and update `APP_URL` accordingly.

When Gmail credentials are absent in development, verification codes and password-reset links appear in the server console.

## Configuration reference

[.env.example](.env.example) contains the main configuration and rate-limit defaults. The startup requirement for `GEMINI_API_KEY` is an additional setting noted above.

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string; required. |
| `SESSION_SECRET` | Session signing secret; required. Use at least 32 characters in production. |
| `APP_URL` | App origin for password-reset links. Required at startup in production, where it must use HTTPS. |
| `PORT` | HTTP port; defaults to `5000`. |
| `AI_INTEGRATIONS_OPENAI_API_KEY` | Main chat provider API key. |
| `AI_INTEGRATIONS_OPENAI_BASE_URL` | Chat provider endpoint; the example uses `https://api.groq.com/openai/v1`. The SDK uses its OpenAI endpoint when omitted. |
| `AI_QUIZ_MODEL` | Quiz generation model; defaults to `openai/gpt-oss-120b`. |
| `AI_VALIDATION_MODEL` | Optional model for solving and independent answer audits; falls back to `AI_QUIZ_MODEL`. |
| `AI_VISION_MODEL` | Image transcription model; defaults to `qwen/qwen3.8-27b`. |
| `AI_VISION_TEXT_TIMEOUT_MS` | AI image transcription time budget before OCR fallback; defaults to `30000`. |
| `AI_EMBEDDING_API_KEY` | Embedding provider key for source retrieval; falls back to `OPENAI_API_KEY`. |
| `AI_EMBEDDING_BASE_URL` | Embedding endpoint; defaults to `https://api.openai.com/v1`. |
| `AI_EMBEDDING_MODEL` | Embedding model; defaults to `text-embedding-3-small`. Must support 1,536 output dimensions. |
| `GEMINI_API_KEY` | Credential for the eagerly initialized Gemini client; required at startup unless `OPENAI_API_KEY` is set. |
| `GOOGLE_CLIENT_ID` | Enables Google sign-in. The current ID-token flow does not use a Google client secret. |
| `GMAIL_USER`, `GMAIL_APP_PASSWORD` | Gmail sender credentials for verification, password resets, and other email features. Required for email delivery in production; development logs email details when credentials are absent. |
| `YOUTUBE_TRANSCRIPT_API_KEY` | Optional external YouTube transcript service key. |
| `SUPADATA_API_KEY` | Optional Supadata key for transcript fetching. |
| `QUIZ_VALIDATION_CONCURRENCY` | Parallel quiz audit batches, from `1` to `4`; defaults to `4`. |

Authentication, email, and AI request limits are configurable through the `AUTH_*`, `CONTACT_RATE_LIMIT`, `PROVIDER_RATE_LIMIT_WINDOW_MS`, and feature-specific rate-limit settings in `.env.example`.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Load `.env` and start Express with Vite and server watch mode. |
| `npm run check` | Run the TypeScript compiler for type checking. |
| `npm run build` | Build the frontend into `dist/public` and the server into `dist/index.mjs`, with a CommonJS startup wrapper. |
| `npm start` | Load `.env` and run the production server through `dist/index.cjs`. |
| `npm run db:push` | Enable pgvector and push the Drizzle schema. |
| `npm run db:generation-drafts` | Apply the generation-draft migrations to an existing database. |

### Tests

Tests use Node's built-in test runner through `tsx`. Run a focused set from the repository root, for example:

```sh
npx tsx --test server/quiz-quality.test.ts server/rag-core.test.ts shared/answer-grading.test.ts
```

Other tests live alongside the code in `server/`, `shared/`, and `client/src/lib/`. Some provider and database tests need additional configuration; check each test's setup before running it. Generation-draft database integration tests are opt-in through `RUN_DRAFT_DB_TEST=1` and require a test database.

There are currently no `test` or `lint` scripts in `package.json`.

## Production build

Configure the production database, provider credentials, email credentials, a session secret of at least 32 characters, and an HTTPS `APP_URL`. Apply the database schema before serving requests, then run:

```sh
npm run build
npm start
```

The production Express server serves the built frontend and API on the configured port. Production session cookies require HTTPS.

The repository also includes `api/index.ts` and `vercel.json` for Vercel hosting. In that configuration, Vercel serves the static frontend and routes `/api/*` to the API entry point.

## Repository layout

```text
client/
  src/
    components/       Shared UI and study components
    hooks/            Authentication, preferences, and UI hooks
    lib/              App contexts, API client, PDF export, and utilities
    pages/            Study, quiz, dashboard, account, and public pages
server/
  index.ts            Express startup and middleware
  routes.ts           API routes and upload handling
  auth.ts             Authentication and session setup
  openai.ts           AI generation, transcription, and validation
  rag.ts              Source indexing and retrieval
  storage.ts          Database access
  db.ts               PostgreSQL and Drizzle connection
shared/               Shared schema, validation, grading, and quiz helpers
script/               Build, database, and diagnostic scripts
migrations/           SQL migrations
api/                  Vercel API entry point
android/              Capacitor Android project
attached_assets/      Shared images and other assets
capacitor.config.ts   Mobile wrapper configuration
drizzle.config.ts     Database schema tooling configuration
.env.example          Environment template
```

The Capacitor configuration currently points to a development server on a local network. Update its `server.url` for your environment before using the Android wrapper.

## Contributing

Keep changes focused and follow the surrounding TypeScript and React conventions. Run `npm run check` and the tests relevant to your changes. For UI or build changes, also run `npm run build`. Include configuration or schema changes in your pull request description.

## License

[MIT](LICENSE).
