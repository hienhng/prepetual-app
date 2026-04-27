# Prepetual 🚀

Prepetual is a premium, AI-powered study platform designed to transform your learning materials into interactive quizzes. Generate quizzes from PDFs, YouTube videos, or text, organize them into folders, and track your progress with a modern, minimalist dashboard.

## ✨ Features

- **AI Quiz Generation**: Automatically create high-quality quizzes from any source material.
- **Multi-Source Support**: Import content from PDF documents, YouTube transcripts, or manual text entry.
- **Folder Management**: Organize your quizzes into custom folders for different subjects or projects.
- **Progress Tracking**: Visualize your learning journey with an interactive dashboard and "In Progress" session tracking.
- **Premium UI/UX**: A sleek, dark-mode-first design with smooth animations and responsive layouts.
- **Authentication**: Secure login via Google OAuth or local credentials.
- **Study Tools**: Integrated AI chatbot, bug reporting, and email notifications.

## 🛠️ Tech Stack

- **Frontend**: React, Vite, Tailwind CSS, Framer Motion, Lucide Icons, Shadcn UI.
- **Backend**: Node.js, Express.
- **Database**: PostgreSQL with Drizzle ORM.
- **AI**: OpenAI API.
- **Auth**: Passport.js (Google & Local).

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v20 or higher)
- [PostgreSQL](https://www.postgresql.org/) database

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/hienhng/prepetual-app.git
   cd prepetual-app
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Setup**:
   Create a `.env` file in the root directory and add your credentials (see `.env.example` for the required keys).

4. **Database Setup**:
   Push the schema to your database:
   ```bash
   npm run db:push
   ```

5. **Start Development Server**:
   ```bash
   npm run dev
   ```

## 📜 Environment Variables

To run this project, you will need to add the following environment variables to your `.env` file:

- `DATABASE_URL`: Your PostgreSQL connection string.
- `SESSION_SECRET`: A random string for session encryption.
- `AI_INTEGRATIONS_OPENAI_API_KEY`: Your OpenAI API key.
- `GOOGLE_CLIENT_ID`: Google OAuth client ID.
- `GMAIL_USER` & `GMAIL_APP_PASSWORD`: For email notifications.

## 📄 License

[MIT](https://choosealicense.com/licenses/mit/)
