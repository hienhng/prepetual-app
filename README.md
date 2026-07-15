# Prepetual

**Prepetual** is an AI‑powered study platform that transforms your learning materials—text, PDFs, Office documents, images, and YouTube videos—into interactive quizzes and helps you master the content.

---

## 🎯 What the App Does

- **Generate quizzes** from any uploaded content (text, PDFs, Office docs, images).
- **YouTube integration** – turn video transcripts into quiz questions.
- **OCR support** for scanned images (English + Vietnamese).
- **Dynamic study mode** – interactive slides, summaries, and flash‑card style revision.
- **Rich UI** built with **React 18**, **Vite**, **Tailwind CSS**, **Framer Motion**, and **Radix UI** for a premium, glassmorphic look.
- **Multi‑language support** (English & Vietnamese) via a simple React context (`language-context.tsx`).
- **User authentication** with Passport (Google OAuth & local strategy) and session storage in PostgreSQL.
- **Real‑time progress** – background uploads with polling and Server‑Sent Events for quiz generation.
- **Export & share** quizzes as PDF files.

---

## 🛠️ Tech Stack

| Layer               | Technologies                                                                                    |
| ------------------- | ----------------------------------------------------------------------------------------------- |
| **Frontend**        | React 18, Vite, Tailwind CSS, Framer Motion, Radix UI, Lucide‑React icons                       |
| **Backend**         | Node 20, Express, WebSocket (`ws`)                                                              |
| **Database**        | PostgreSQL + Drizzle ORM                                                                        |
| **AI**              | Groq AI API                                                                                     |
| **File Processing** | `multer`, `pdfjs-dist`, `pdf-parse`, `officeparser`, `tesseract.js`                             |
| **Auth / Sessions** | `passport`, `passport-local`, `passport-google-oauth20`, `express-session`, `connect-pg-simple` |
| **Email**           | `nodemailer`                                                                                    |

---

## 📂 Project Structure (high‑level)

```
client/                # React/Vite frontend
  src/
    pages/            # Home, FAQ, Study, Settings, etc.
    components/       # UI primitives (Button, Card, Accordion…)
    lib/              # language‑context.tsx, utils, hooks
    App.tsx           # Root component with router
server/                # Express API
  src/
    openai.ts         # OpenAI wrapper
    routes.ts        # API endpoints (quiz, upload, auth…)
    db/               # Drizzle schema & migrations
.env.example           # Environment variable template
README.md              # This document
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v20+
- **PostgreSQL** v14+ (local or hosted)
- Build tools for native deps (e.g., `@napi-rs/canvas`) – install Windows Build Tools if needed.

### Installation

```bash
# Clone the repo and cd into it
git clone <repo‑url>
cd Prepetual

# Install deps
npm install
```

### Configure Environment

```bash
# Copy the example and edit values
cp .env.example .env
# Then set:
#   DATABASE_URL=postgres://user:pass@localhost:5432/prepetual
#   SESSION_SECRET=your‑secret
#   AI_INTEGRATIONS_OPENAI_API_KEY=your‑openai‑key
#   (optional) AI_INTEGRATIONS_OPENAI_BASE_URL=…
#   GMAIL_USER=your‑mail@example.com
#   GMAIL_APP_PASSWORD=app‑password
```

### Database Setup

```bash
npm run db:push   # Push Drizzle schema to PostgreSQL
```

### Run Development Server

```bash
npm run dev    # Starts Express + Vite middleware (http://localhost:5000)
```

Visit the app in the browser and you’ll see the home page with a hero section, FAQ accordion, and study‑mode entry points.

---

## 📋 Environment Variables

| Variable                                    | Required | Description                                  |
| ------------------------------------------- | -------- | -------------------------------------------- |
| `DATABASE_URL`                              | ✅       | PostgreSQL connection string                 |
| `SESSION_SECRET`                            | ✅       | Secret for signing session cookies           |
| `AI_INTEGRATIONS_OPENAI_API_KEY`            | ✅       | OpenAI (or compatible) API key               |
| `AI_INTEGRATIONS_OPENAI_BASE_URL`           | ❌       | Override base URL (defaults to OpenAI)       |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | ❌       | Google OAuth credentials                     |
| `GMAIL_USER` & `GMAIL_APP_PASSWORD`         | ✅       | Email sender for notifications               |
| `YOUTUBE_TRANSCRIPT_API_KEY`                | ❌       | Enables reliable YouTube transcript fetching |

---

## 🎨 Design Guidelines

The UI follows a **premium glass‑morphic aesthetic**:

- Dark mode with subtle gradients.
- Rounded corners, soft shadows, and hover micro‑animations.
- Primary accent color is `#3b82f6` (Tailwind `primary`).
- Icons from **Lucide‑React** for consistent visual language.
- Responsive layouts using Tailwind’s utility classes.

For detailed design tokens and component guidelines, see `design-guideline.md`.

---

## 🧭 Pages Overview

- **Home (`/`)** – Hero with animated background, call‑to‑action buttons, and a feature showcase carousel.
- **FAQ (`/faq`)** – Accordion list of common questions; each entry has a unique `id` (e.g., `item-1`, `item-2`).
- **Study (`/study`)** – Interactive study mode with slide‑by‑slide explanations, generated quiz questions, and progress tracking.
- **Settings (`/settings`)** – Language toggle (English/Vietnamese) via `language-context.tsx`, theme switch, and account management.

---

## 🧪 Testing & Linting

```bash
npm run check   # TypeScript type‑check
npm run lint    # ESLint (if configured)
```

---

## 🤝 Contributing

1. Fork the repository.
2. Create a feature branch (`git checkout -b feat/awesome-feature`).
3. Follow the existing code style (Prettier + ESLint).
4. Open a Pull Request.

---

## 📄 License

MIT – see `LICENSE` for details.

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

| Variable                          | Required | Description                                                                         |
| --------------------------------- | -------- | ----------------------------------------------------------------------------------- |
| `DATABASE_URL`                    | Yes      | Postgres connection string                                                          |
| `SESSION_SECRET`                  | Yes      | Secret used to sign session cookies                                                 |
| `AI_INTEGRATIONS_OPENAI_API_KEY`  | Yes      | API key for your OpenAI (or compatible) provider                                    |
| `AI_INTEGRATIONS_OPENAI_BASE_URL` | No       | Override base URL (defaults to OpenAI)                                              |
| `GOOGLE_CLIENT_ID`                | No       | Google OAuth client ID (needed for Google login)                                    |
| `GMAIL_USER`                      | Yes      | Sender account for email features                                                   |
| `GMAIL_APP_PASSWORD`              | Yes      | App password for `GMAIL_USER`                                                       |
| `YOUTUBE_TRANSCRIPT_API_KEY`      | No       | Enables the most reliable transcript fetch method (uses an external transcript API) |

## Useful scripts

- `npm run dev`: Start the Express server in dev mode (also serves Vite via middleware)
- `npm run db:push`: Push Drizzle schema to the database
- `npm run check`: Typecheck
- `npm run build`: Build client + server into `dist/`
- `npm run start`: Run the production bundle from `dist/`

## License

MIT. See `LICENSE`.
