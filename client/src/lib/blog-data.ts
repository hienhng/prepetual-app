import educationTechImg from "@assets/stock_images/education_technology_2b7a5460.jpg";
import aiRobotImg from "@assets/stock_images/artificial_intellige_de833e12.jpg";
import organizedDeskImg from "@assets/stock_images/organized_student_de_5cb006a3.jpg";
import onlineLearningImg from "@assets/stock_images/online_learning_digi_42d10943.jpg";
import studentStudyingImg from "@assets/stock_images/student_studying_exa_4e0e4082.jpg";
import brainMemoryImg from "@assets/stock_images/brain_memory_learnin_6d97ed0d.jpg";

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  image: string;
  date: string;
  author: string;
  readTime: string;
  category: string;
}

export const blogPosts: BlogPost[] = [
  {
    id: "quizlet-alternatives-2026",
    title: "The Best Quizlet Alternatives for 2026",
    excerpt: "With changes to study tools, students are looking for better ways to learn. Here is why Prepetual is leading the pack.",
    content: `
## Why Students Are Looking for Quizlet Alternatives

The landscape of digital study tools has shifted dramatically in recent years. With Quizlet's changes to its free tier and the rise of AI-powered learning, students are actively seeking alternatives that offer more value.

### What Makes a Great Study Tool?

When evaluating study platforms, consider these key factors:

1. **AI-Powered Generation**: The ability to automatically create quizzes from your notes saves hours of manual work.
2. **Multiple Question Types**: Variety keeps your brain engaged and tests knowledge from different angles.
3. **Progress Tracking**: Understanding where you're strong and where you need work is crucial.
4. **Accessibility**: A tool is only useful if you can access it when you need it.

### Why Prepetual Stands Out

Unlike traditional flashcard apps, Prepetual uses advanced AI to analyze your study materials and generate comprehensive quizzes. Simply upload your notes, textbook excerpts, or lecture slides, and watch as the AI creates targeted questions that test your understanding.

### The Future of Studying

The future belongs to tools that adapt to how you learn. With features like difficulty adjustment, Vietnamese language support, and instant feedback with explanations, Prepetual represents the next generation of study technology.

Ready to transform how you study? Give Prepetual a try today.
    `,
    image: educationTechImg,
    date: "Jan 10, 2026",
    author: "Alex Rivers",
    readTime: "5 min read",
    category: "EdTech"
  },
  {
    id: "convert-notes-to-quizzes",
    title: "How to Convert Raw Notes into Interactive Study Materials",
    excerpt: "Learn the secrets of using AI to transform your messy lecture notes into structured, interactive quizzes in seconds.",
    content: `
## From Chaos to Clarity: Transforming Your Notes

We've all been there - pages of hastily scribbled notes that seem impossible to study from. But what if you could turn those notes into interactive quizzes in seconds?

### The Traditional Approach

Traditionally, converting notes into study materials meant:
- Re-reading and highlighting key points
- Manually creating flashcards
- Writing practice questions yourself
- Spending hours organizing information

This process could take longer than the original lecture!

### The AI Revolution in Note-Taking

Modern AI tools can analyze your notes and extract the most important concepts automatically. Here's how it works:

1. **Upload Your Notes**: Whether typed or handwritten (via image upload), the AI processes your content.
2. **Smart Extraction**: The system identifies key concepts, definitions, and relationships.
3. **Question Generation**: Multiple question types are created to test different aspects of the material.
4. **Instant Review**: Start practicing immediately with your personalized quiz.

### Tips for Better Results

To get the most out of AI-powered quiz generation:
- **Include context**: The more information you provide, the better the questions.
- **Structure your notes**: Basic organization helps the AI understand relationships.
- **Review and edit**: AI-generated questions can be customized to focus on what matters most to you.

### Try It Yourself

Upload a document today and see how quickly you can go from raw notes to a fully interactive quiz!
    `,
    image: aiRobotImg,
    date: "Jan 08, 2026",
    author: "Dr. Sarah Chen",
    readTime: "8 min read",
    category: "Study Tips"
  },
  {
    id: "digital-study-space-organization",
    title: "Organizing Your Digital Study Space for Maximum Focus",
    excerpt: "A clean digital environment leads to a clear mind. Discover the top tools and habits for digital organization.",
    content: `
## The Hidden Cost of Digital Clutter

Studies show that digital clutter can be just as distracting as physical clutter. Every open tab, notification, and disorganized folder competes for your attention.

### Building Your Digital Study Sanctuary

#### 1. The One-Tab Rule
When studying, aim to have only the essential tabs open. Bookmark everything else for later.

#### 2. Notification Management
Turn on Do Not Disturb mode during study sessions. Your messages can wait.

#### 3. Folder Structure
Create a simple, consistent folder structure for your study materials:
- By Subject
- By Semester
- By Project/Assignment

#### 4. Cloud Synchronization
Use cloud storage to access your materials from any device. Never lose notes again.

### Tools That Help

Consider using:
- **Focus apps** that block distracting websites
- **Note-taking apps** with good organization features
- **Quiz platforms** like Prepetual that keep all your study materials in one place

### The 5-Minute Cleanup

End each study session with a 5-minute digital cleanup:
1. Close unnecessary tabs
2. Save and organize new notes
3. Clear your downloads folder
4. Review tomorrow's study plan

A organized digital space leads to more productive study sessions and less stress.
    `,
    image: organizedDeskImg,
    date: "Jan 05, 2026",
    author: "Jordan Smith",
    readTime: "4 min read",
    category: "Productivity"
  },
  {
    id: "future-of-online-learning",
    title: "The Future of Online Learning: Trends to Watch in 2026",
    excerpt: "From AI tutors to immersive experiences, discover what's shaping the next generation of digital education.",
    content: `
## Online Learning Has Come a Long Way

Remember when online learning meant watching pre-recorded lectures? Those days are long gone.

### Key Trends Shaping 2026

#### 1. Personalized AI Tutors
AI systems now adapt to individual learning styles and paces. They identify weak areas and automatically adjust content to address gaps.

#### 2. Interactive Content
Static PDFs are being replaced by interactive materials that respond to student engagement. Quizzes, simulations, and hands-on exercises are now standard.

#### 3. Microlearning
Long lectures are giving way to bite-sized learning modules. Students can learn in 10-15 minute sessions that fit into busy schedules.

#### 4. Social Learning
Even in digital spaces, collaboration matters. Study groups, peer review, and shared resources create community.

### What This Means for Students

The shift to personalized, interactive learning means:
- More efficient study sessions
- Better retention of information
- Flexibility to learn anywhere, anytime
- Immediate feedback on progress

### Embracing the Change

Don't wait for your institution to catch up. Start using AI-powered tools today to supplement your learning and stay ahead of the curve.
    `,
    image: onlineLearningImg,
    date: "Jan 03, 2026",
    author: "Marcus Lee",
    readTime: "6 min read",
    category: "EdTech"
  },
  {
    id: "effective-exam-preparation",
    title: "Effective Exam Preparation: A Science-Based Approach",
    excerpt: "Discover proven strategies backed by cognitive science to maximize your exam performance and reduce study anxiety.",
    content: `
## Studying Smarter, Not Harder

Cramming the night before rarely works. Here's what cognitive science tells us about effective exam preparation.

### The Spacing Effect

Instead of marathon study sessions, spread your learning over time. This "spacing effect" dramatically improves long-term retention.

**Try this:**
- Start studying 2-3 weeks before the exam
- Review material in short sessions across multiple days
- Increase review frequency as the exam approaches

### Active Recall

Passive reading is one of the least effective study methods. Instead, practice active recall by:
- Testing yourself with practice questions
- Explaining concepts without looking at notes
- Using flashcards or quiz apps

### The Testing Effect

Taking practice tests isn't just for assessment - it's actually one of the best ways to learn. Each time you retrieve information, you strengthen the memory.

### Managing Exam Anxiety

Some stress is normal, but too much hurts performance:
- **Prepare thoroughly** - Confidence comes from preparation
- **Sleep well** - Your brain consolidates memories during sleep
- **Avoid cramming** - Last-minute panic increases anxiety
- **Practice deep breathing** - Simple but effective

### Put It Into Practice

Combine these strategies with AI-generated practice quizzes for maximum effectiveness. Upload your study materials and start testing yourself today!
    `,
    image: studentStudyingImg,
    date: "Dec 28, 2025",
    author: "Dr. Emily Foster",
    readTime: "7 min read",
    category: "Study Tips"
  },
  {
    id: "science-of-memory",
    title: "The Science of Memory: How Your Brain Learns and Retains Information",
    excerpt: "Understanding how memory works can help you study more effectively. Explore the neuroscience behind learning.",
    content: `
## How Memories Are Made

Every time you learn something new, your brain creates connections between neurons. Understanding this process can transform how you study.

### Short-Term vs. Long-Term Memory

**Short-term memory** holds information for about 20-30 seconds. To move information to **long-term memory**, you need to:
- Pay attention
- Connect new information to existing knowledge
- Review and reinforce regularly

### The Role of Sleep

Sleep isn't just rest - it's when your brain consolidates memories. During sleep:
- The hippocampus replays the day's experiences
- Important connections are strengthened
- Irrelevant information is pruned

This is why all-night cramming sessions backfire!

### Emotional Connections

Information connected to emotions is remembered better. This is why:
- Stories are more memorable than facts
- Personal relevance improves retention
- Positive emotions aid learning

### Practical Applications

Use this knowledge to study better:

1. **Space your learning** - Give your brain time to consolidate
2. **Get enough sleep** - Especially before exams
3. **Create connections** - Link new concepts to what you already know
4. **Stay engaged** - Interactive learning beats passive reading
5. **Test yourself** - Retrieval strengthens memory pathways

### The Bottom Line

Your brain is designed to learn. Work with it, not against it, and you'll be amazed at what you can retain.
    `,
    image: brainMemoryImg,
    date: "Dec 22, 2025",
    author: "Dr. Rachel Kim",
    readTime: "9 min read",
    category: "Science"
  }
];

export function getBlogPostById(id: string): BlogPost | undefined {
  return blogPosts.find(post => post.id === id);
}
