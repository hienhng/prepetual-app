# Prepetual 🚀

Prepetual is a premium, AI-powered study platform designed to transform your learning materials into interactive, mastery-based quizzes. Whether you have handwritten notes, complex PDFs, or lengthy YouTube lectures, Prepetual turns them into a personalized learning path.

---

## ✨ Core Features

### 🧠 AI Smart Generation
Turn static content into active learning tools in seconds.
- **Notes to Quiz**: Convert raw text or lecture notes into high-quality questions.
- **YouTube Integration**: Paste a URL and let the AI analyze the transcript to generate relevant practice.
- **Document Analysis**: Upload PDFs or Office documents. The AI "reads" the content (including images) to create context-aware questions.
- **Handwriting Support**: Advanced OCR capabilities to handle scanned notes and images.

### 🔍 AI Smart Import (Exam Scanner)
Already have a test paper but no answer key?
- **Scanner Mode**: Upload an existing exam or worksheet.
- **Auto-Solve**: The AI identifies the questions, understands the context, and finds/verifies the correct answers for you.
- **Digitization**: Turns your physical papers into interactive digital quizzes.

### 🎮 Interactive Study Experience
Designed to keep you engaged and motivated.
- **Instant Feedback**: Get immediate results with encouraging messages and "streak" tracking.
- **AI Explanations**: Don't just see the answer; understand the *why* with on-demand AI explanations for every option.
- **Confetti & Rewards**: Celebrate mastery with visual rewards for perfect streaks.
- **AI Tutor (Chatbot)**: Stuck on a question? Chat with the integrated study assistant for deep-dives into any topic.

### 📂 Library & Folders
Keep your study life organized.
- **Custom Folders**: Categorize quizzes by subject, semester, or project.
- **In-Progress Tracking**: Pick up exactly where you left off with session persistence.
- **Performance History**: Review your past results to identify weak spots.

---

## 🔄 How it Works (Workflows)

### 1. The Creation Workflow
1.  **Upload**: Select your source (PDF, YouTube Link, Image, or Text).
2.  **Configure**: Choose question count (3-20), difficulty (Easy, Medium, Hard), and types (Multiple Choice, True/False, Short Answer).
3.  **Process**: Watch the AI analyze your material in real-time with our streaming generation engine.
4.  **Save**: Organize it into a folder and you're ready to study.

### 2. The Learning Workflow
1.  **Practice**: Answer questions one-by-one with a sleek, minimalist interface.
2.  **Understand**: If you get one wrong, use the "AI Explanation" button to get a detailed breakdown.
3.  **Chat**: Use the Sidebar Chatbot to ask follow-up questions about the material.
4.  **Review**: At the end, see your "Study Insights" and decide if you need to retake or move to the next topic.

---

## 🛠️ Tech Stack

- **Frontend**: `React 18`, `Vite`, `Tailwind CSS`, `Framer Motion` (Animations), `Lucide Icons`.
- **Backend**: `Node.js`, `Express`.
- **Database**: `PostgreSQL` with `Drizzle ORM`.
- **AI Engine**: `OpenAI GPT-4o` (Text & Vision).
- **Auth**: `Passport.js` with `Google OAuth 2.0` and `Local Strategy`.
- **Email**: `Nodemailer`.

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v20 or higher)
- [PostgreSQL](https://www.postgresql.org/) (Local or Cloud instance like Neon)

### Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/hienhng/prepetual-app.git
    cd prepetual-app
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Environment Setup**:
    Create a `.env` file in the root directory (refer to `.env.example`).
    ```bash
    cp .env.example .env
    ```

4.  **Database Setup**:
    ```bash
    npm run db:push
    ```

5.  **Start Development Server**:
    ```bash
    npm run dev
    ```

---

## 📜 Environment Variables

To run this project, you will need to add the following to your `.env` file:

| Variable | Description |
| :--- | :--- |
| `DATABASE_URL` | Your PostgreSQL connection string |
| `SESSION_SECRET` | Secret key for session encryption |
| `AI_INTEGRATIONS_OPENAI_API_KEY` | Your OpenAI API key |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID |
| `GMAIL_USER` | Gmail address for sending notifications |
| `GMAIL_APP_PASSWORD` | App-specific password for Gmail |

---

## 📄 License
Distributed under the MIT License. See `LICENSE` for more information.
