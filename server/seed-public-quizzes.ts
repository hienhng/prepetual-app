import { storage } from "./storage.js";
import type { InsertQuiz } from "../shared/schema.js";

const CURATED_USER_EMAIL = "giahienhn@gmail.com";
const CURATED_USER_NAME = "Gia Hien";

const curatedQuizzes: Array<Omit<InsertQuiz, "userId">> = [
  {
    title: "SAT Math Problem Set",
    sourceText: "SAT Math practice questions covering algebra, geometry, and data analysis.",
    sourceImageUrl: null,
    sourceImages: null,
    questions: [
      {
        id: "sat-math-1",
        type: "multiple_choice",
        question: "A line has equation y = 2x + 3. What is y when x = 4?",
        options: ["11", "10", "9", "8"],
        correctAnswer: "11",
        explanation: "Substitute x = 4 into the equation: y = 2(4) + 3 = 8 + 3 = 11.",
      },
      {
        id: "sat-math-2",
        type: "multiple_choice",
        question: "If the ratio of a to b is 2:3 and a + b = 25, what is a?",
        options: ["10", "12", "15", "8"],
        correctAnswer: "10",
        explanation: "Let a = 2k and b = 3k, then 5k = 25, so k = 5 and a = 10.",
      },
      {
        id: "sat-math-3",
        type: "true_false",
        question: "The graph of y = x^2 + 4x + 4 is a parabola opening upward.",
        correctAnswer: "True",
        explanation: "The coefficient of x^2 is positive, so the parabola opens upward.",
      },
      {
        id: "sat-math-4",
        type: "multiple_choice",
        question: "A circle has radius 3. What is its area in terms of π?",
        options: ["9π", "6π", "18π", "3π"],
        correctAnswer: "9π",
        explanation: "Area = πr^2 = π × 3^2 = 9π.",
      },
    ],
    difficulty: "medium",
    category: "Math",
    generationMode: "generate",
    isPublic: 1,
  },
  {
    title: "IELTS Reading Skills Quiz",
    sourceText: "IELTS English reading and grammar practice to build vocabulary and comprehension skills.",
    sourceImageUrl: null,
    sourceImages: null,
    questions: [
      {
        id: "ielts-eng-1",
        type: "multiple_choice",
        question: "In the sentence 'The committee ___ its decision,' which verb form is correct?",
        options: ["have made", "has made", "had made", "will have made"],
        correctAnswer: "has made",
        explanation: "The subject 'committee' is singular, so the singular verb 'has made' is correct.",
      },
      {
        id: "ielts-eng-2",
        type: "multiple_choice",
        question: "Which word is an antonym of 'unlikely'?",
        options: ["probable", "impossible", "uncertain", "doubtful"],
        correctAnswer: "probable",
        explanation: "An antonym of 'unlikely' is 'probable', meaning the opposite in likelihood.",
      },
      {
        id: "ielts-eng-3",
        type: "true_false",
        question: "The word 'their' is a possessive pronoun.",
        correctAnswer: "True",
        explanation: "Their indicates possession and is a possessive pronoun.",
      },
      {
        id: "ielts-eng-4",
        type: "short_answer",
        question: "What is the past tense of 'to teach'?",
        correctAnswer: "taught",
        explanation: "The past tense of teach is taught.",
      },
    ],
    difficulty: "medium",
    category: "English",
    generationMode: "generate",
    isPublic: 1,
  },
  {
    title: "AP Biology Cell Structure Quiz",
    sourceText: "AP Biology practice focused on cell organelles and their functions.",
    sourceImageUrl: null,
    sourceImages: null,
    questions: [
      {
        id: "ap-bio-1",
        type: "multiple_choice",
        question: "Which organelle is responsible for producing ATP?",
        options: ["Chloroplast", "Mitochondrion", "Nucleus", "Golgi apparatus"],
        correctAnswer: "Mitochondrion",
        explanation: "Mitochondria generate ATP through cellular respiration.",
      },
      {
        id: "ap-bio-2",
        type: "true_false",
        question: "DNA is copied during the S phase of the cell cycle.",
        correctAnswer: "True",
        explanation: "The S phase is when DNA replication occurs.",
      },
      {
        id: "ap-bio-3",
        type: "multiple_choice",
        question: "Which structure controls what enters and leaves a cell?",
        options: ["Cell wall", "Cytoplasm", "Cell membrane", "Ribosome"],
        correctAnswer: "Cell membrane",
        explanation: "The cell membrane regulates the passage of materials in and out of the cell.",
      },
      {
        id: "ap-bio-4",
        type: "short_answer",
        question: "Name the organelle where photosynthesis occurs.",
        correctAnswer: "Chloroplast",
        explanation: "Photosynthesis takes place in chloroplasts.",
      },
    ],
    difficulty: "medium",
    category: "Science",
    generationMode: "generate",
    isPublic: 1,
  },
  {
    title: "AP U.S. History Founding Era",
    sourceText: "AP U.S. History practice questions about the Constitutional Convention and early American government.",
    sourceImageUrl: null,
    sourceImages: null,
    questions: [
      {
        id: "apush-1",
        type: "multiple_choice",
        question: "Which document first established self-government in the American colonies?",
        options: ["Federalist Papers", "Bill of Rights", "Mayflower Compact", "Emancipation Proclamation"],
        correctAnswer: "Mayflower Compact",
        explanation: "The Mayflower Compact was an early agreement for self-government among Plymouth settlers.",
      },
      {
        id: "apush-2",
        type: "true_false",
        question: "The Constitution was ratified before the Articles of Confederation.",
        correctAnswer: "False",
        explanation: "The Articles of Confederation were adopted before the Constitution.",
      },
      {
        id: "apush-3",
        type: "multiple_choice",
        question: "The system of checks and balances was designed to prevent which of the following?",
        options: ["Economic inequality", "Tyranny", "Foreign invasion", "Religious conflict"],
        correctAnswer: "Tyranny",
        explanation: "Checks and balances were created to prevent any branch from gaining too much power.",
      },
      {
        id: "apush-4",
        type: "short_answer",
        question: "Who is considered the primary author of the Declaration of Independence?",
        correctAnswer: "Thomas Jefferson",
        explanation: "Thomas Jefferson is credited as the principal author of the Declaration.",
      },
    ],
    difficulty: "medium",
    category: "Social Studies",
    generationMode: "generate",
    isPublic: 1,
  },
  {
    title: "AP Spanish Language Practice",
    sourceText: "AP Spanish Language practice covering grammar, vocabulary, and short translation questions.",
    sourceImageUrl: null,
    sourceImages: null,
    questions: [
      {
        id: "ap-spanish-1",
        type: "multiple_choice",
        question: "Choose the correct translation: 'I am going to the store.'",
        options: ["Voy a la tienda.", "Soy a la tienda.", "Estoy en la tienda.", "Iré a la tienda."],
        correctAnswer: "Voy a la tienda.",
        explanation: "Voy a la tienda means 'I am going to the store.'",
      },
      {
        id: "ap-spanish-2",
        type: "true_false",
        question: "In Spanish, adjectives usually come after the noun they describe.",
        correctAnswer: "True",
        explanation: "Spanish adjectives typically follow the noun, although exceptions exist.",
      },
      {
        id: "ap-spanish-3",
        type: "multiple_choice",
        question: "Which word means 'to study' in Spanish?",
        options: ["Cantar", "Estudiar", "Dormir", "Correr"],
        correctAnswer: "Estudiar",
        explanation: "Estudiar means 'to study.'",
      },
      {
        id: "ap-spanish-4",
        type: "short_answer",
        question: "Translate to English: 'Ella tiene dos hermanos.'",
        correctAnswer: "She has two brothers.",
        explanation: "Ella tiene dos hermanos means 'She has two brothers.'",
      },
    ],
    difficulty: "medium",
    category: "Global Languages",
    generationMode: "generate",
    isPublic: 1,
  },
  {
    title: "GRE Verbal Reasoning Practice",
    sourceText: "GRE Verbal reasoning practice with vocabulary and reading comprehension questions.",
    sourceImageUrl: null,
    sourceImages: null,
    questions: [
      {
        id: "gre-verbal-1",
        type: "multiple_choice",
        question: "Choose the word that best completes the sentence: 'The scientist's theory was not only innovative but also highly ___.'",
        options: ["implausible", "unsubstantiated", "credible", "nebulous"],
        correctAnswer: "credible",
        explanation: "Credible fits the positive description about the theory.",
      },
      {
        id: "gre-verbal-2",
        type: "true_false",
        question: "In reading comprehension, 'main idea' refers to the overall point of the passage.",
        correctAnswer: "True",
        explanation: "The main idea is the central point the passage communicates.",
      },
      {
        id: "gre-verbal-3",
        type: "multiple_choice",
        question: "A word meaning 'to make something less severe' is:",
        options: ["exacerbate", "mitigate", "intensify", "complicate"],
        correctAnswer: "mitigate",
        explanation: "Mitigate means to lessen severity.",
      },
      {
        id: "gre-verbal-4",
        type: "short_answer",
        question: "What does 'analogy' test in verbal reasoning?",
        correctAnswer: "the relationship between two pairs of words",
        explanation: "Analogy questions ask about the relationship between word pairs.",
      },
    ],
    difficulty: "medium",
    category: "Others/General",
    generationMode: "generate",
    isPublic: 1,
  },
];

export async function seedPublicQuizzes() {
  try {
    const existingPublicQuizzes = await storage.getPublicQuizzes();
    const existingTitles = new Set(existingPublicQuizzes.map((quiz) => quiz.title));

    let user = await storage.getUserByEmail(CURATED_USER_EMAIL);
    if (!user) {
      user = await storage.createUser({
        email: CURATED_USER_EMAIL,
        username: CURATED_USER_NAME,
        emailVerified: true,
        authProvider: "email",
        profileImageUrl: null,
        feedbackStyle: "Encouraging & Patient",
        persona: "High School Student",
        subjectInclination: "Science & STEM",
        aiPartnership: "The Strategic Breakdown (Step-by-Step)",
      });
    }

    const missingSeeds = curatedQuizzes.filter(seed => !existingTitles.has(seed.title));
    if (missingSeeds.length === 0) {
      return;
    }

    for (const seed of missingSeeds) {
      await storage.saveQuiz({
        ...seed,
        userId: user.id,
        lecture: seed.lecture || undefined,
      } as any);
    }

    console.log(`Seeded ${missingSeeds.length} curated public quizzes for ${CURATED_USER_EMAIL}`);
  } catch (error) {
    console.error("Failed to seed curated public quizzes:", error);
  }
}

if (process.argv[1] && process.argv[1].endsWith("seed-public-quizzes.ts")) {
  seedPublicQuizzes().catch((error) => {
    console.error("Top-level seed execution failed:", error);
  });
}
