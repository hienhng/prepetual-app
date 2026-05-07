# Prepetual

Prepetual is an AI-powered study platform that turns your learning materials (text, PDFs, Office docs, images, and YouTube videos) into interactive quizzes, then helps you review what you missed.

## Features

- **Quiz generation from content**: Paste text or upload files to generate multiple-choice / true-false / short-answer questions.
- **YouTube to quiz**: Paste a YouTube URL and generate questions from the video transcript (when captions are available).
- **Document parsing + OCR**: Extracts text from PDFs and Office files; runs OCR for scanned/handwritten images (English + Vietnamese).
- **Async uploads with progress**: Background upload jobs with polling for status + progress.
- **Streaming generation**: Server-Sent Events (SSE) endpoint for generation progress updates.
- **Import existing quizzes (exam scanner)**: Upload an existing worksheet/exam and let AI structure it into a quiz.
- **Summaries**: Summarize long study material into key points.
- **Auth + sessions**: Passport-based auth (Google OAuth + local), session storage backed by Postgres.

## Requirements

- **Node.js**: v20+
- **PostgreSQL**: v14+ (local or hosted)
- **npm**: comes with Node
- **Native deps (may be required)**: some packages (notably `@napi-rs/canvas`) may require platform build tools if your install fails.

## Dependencies (high level)

- **Frontend**: React 18, Vite, Tailwind CSS, Framer Motion, Radix UI
- **Backend**: Node.js, Express, WebSocket (`ws`)
- **DB / ORM**: Postgres (`pg`), Drizzle ORM + drizzle-kit
- **AI**: `openai` SDK (supports OpenAI-compatible base URLs)
- **File processing**: `multer`, `pdfjs-dist`, `pdf-parse`, `officeparser`, `tesseract.js`
- **Auth / sessions**: `passport`, `passport-local`, `express-session`, `connect-pg-simple`
- **Email**: `nodemailer`

## Run locally

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment**

   Create `.env` from the example:

   ```bash
   cp .env.example .env
   ```

   PowerShell:

   ```powershell
   Copy-Item .env.example .env
   ```

3. **Set up the database**

   - Ensure Postgres is running and `DATABASE_URL` in `.env` points to it.
   - Push the Drizzle schema:

   ```bash
   npm run db:push
   ```

4. **Start dev server**

   ```bash
   npm run dev
   ```

   Then open `http://localhost:5000` (default port). You can override with `PORT` in `.env`.

## Environment variables

See `.env.example` for the full list. Common ones:

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | Yes | Postgres connection string |
| `SESSION_SECRET` | Yes | Secret used to sign session cookies |
| `AI_INTEGRATIONS_OPENAI_API_KEY` | Yes | API key for your OpenAI (or compatible) provider |
| `AI_INTEGRATIONS_OPENAI_BASE_URL` | No | Override base URL (defaults to OpenAI) |
| `GOOGLE_CLIENT_ID` | No | Google OAuth client ID (needed for Google login) |
| `GMAIL_USER` | Yes | Sender account for email features |
| `GMAIL_APP_PASSWORD` | Yes | App password for `GMAIL_USER` |
| `YOUTUBE_TRANSCRIPT_API_KEY` | No | Enables the most reliable transcript fetch method (uses an external transcript API) |

## Useful scripts

- `npm run dev`: Start the Express server in dev mode (also serves Vite via middleware)
- `npm run db:push`: Push Drizzle schema to the database
- `npm run check`: Typecheck
- `npm run build`: Build client + server into `dist/`
- `npm run start`: Run the production bundle from `dist/`

## License

MIT. See `LICENSE`.
