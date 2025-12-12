import { useState } from "react";
import { useLocation, Link } from "wouter";
import { motion } from "framer-motion";
import { Save, X, Plus, Trash2, Edit2, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuiz } from "@/lib/quiz-context";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Question, QuestionType } from "@shared/schema";

export default function EditQuizPage() {
  const [, setLocation] = useLocation();
  const { currentQuiz, setCurrentQuiz } = useQuiz();
  const { toast } = useToast();
  const [title, setTitle] = useState(currentQuiz?.title || "");
  const [questions, setQuestions] = useState<Question[]>(
    (currentQuiz?.questions as Question[]) || []
  );
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);
  const [isSaving, setIsSaving] = useState(false);

  if (!currentQuiz) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <Edit2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">No quiz to edit</h2>
        <p className="text-muted-foreground mb-4">
          Generate a quiz first to edit it
        </p>
        <Link href="/generate">
          <Button data-testid="button-go-generate">Create Quiz</Button>
        </Link>
      </div>
    );
  }

  const handleQuestionChange = (index: number, field: keyof Question, value: any) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const handleOptionChange = (questionIndex: number, optionIndex: number, value: string) => {
    const updated = [...questions];
    const options = [...(updated[questionIndex].options || [])];
    options[optionIndex] = value;
    updated[questionIndex] = { ...updated[questionIndex], options };
    setQuestions(updated);
  };

  const addOption = (questionIndex: number) => {
    const updated = [...questions];
    const options = [...(updated[questionIndex].options || [])];
    options.push(`${String.fromCharCode(65 + options.length)}) New option`);
    updated[questionIndex] = { ...updated[questionIndex], options };
    setQuestions(updated);
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const updated = [...questions];
    const options = [...(updated[questionIndex].options || [])];
    options.splice(optionIndex, 1);
    updated[questionIndex] = { ...updated[questionIndex], options };
    setQuestions(updated);
  };

  const addQuestion = () => {
    const newQuestion: Question = {
      id: `new-${Date.now()}`,
      type: "multiple_choice",
      question: "New question",
      options: ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
      correctAnswer: "A) Option 1",
      explanation: "",
    };
    setQuestions([...questions, newQuestion]);
    setExpandedIndex(questions.length);
  };

  const removeQuestion = (index: number) => {
    if (questions.length <= 1) {
      toast({ title: "Cannot remove", description: "Quiz must have at least one question" });
      return;
    }
    const updated = [...questions];
    updated.splice(index, 1);
    setQuestions(updated);
    setExpandedIndex(null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await apiRequest("PUT", `/api/quiz/${currentQuiz.id}`, {
        title,
        questions,
      });
      const updatedQuiz = await response.json();
      setCurrentQuiz(updatedQuiz);
      queryClient.invalidateQueries({ queryKey: ["/api/quizzes"] });
      toast({ title: "Quiz saved", description: "Your changes have been saved" });
      setLocation("/quiz");
    } catch (error) {
      toast({ title: "Error", description: "Failed to save quiz", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartQuiz = () => {
    setCurrentQuiz({
      ...currentQuiz,
      title,
      questions,
    } as any);
    setLocation("/quiz");
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-bold">Edit Quiz</h1>
            <p className="text-sm text-muted-foreground">Customize questions before taking the quiz</p>
          </div>
          <div className="flex gap-2">
            <Link href="/generate">
              <Button variant="outline" data-testid="button-cancel-edit">
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
            </Link>
            <Button onClick={handleStartQuiz} data-testid="button-start-edited">
              Start Quiz
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quiz Title</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter quiz title"
              data-testid="input-quiz-title"
            />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Questions ({questions.length})</h2>
            <Button variant="outline" onClick={addQuestion} data-testid="button-add-question">
              <Plus className="h-4 w-4 mr-1" />
              Add Question
            </Button>
          </div>

          {questions.map((question, index) => (
            <Card key={question.id} data-testid={`card-question-${index}`}>
              <CardHeader 
                className="cursor-pointer py-3"
                onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm text-muted-foreground">Q{index + 1}</span>
                    <span className="text-sm font-medium truncate">{question.question}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeQuestion(index);
                      }}
                      data-testid={`button-remove-question-${index}`}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                    {expandedIndex === index ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </CardHeader>

              {expandedIndex === index && (
                <CardContent className="space-y-4 pt-0">
                  <div className="space-y-2">
                    <Label>Question Type</Label>
                    <Select
                      value={question.type}
                      onValueChange={(value: QuestionType) => handleQuestionChange(index, "type", value)}
                    >
                      <SelectTrigger data-testid={`select-type-${index}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                        <SelectItem value="true_false">True/False</SelectItem>
                        <SelectItem value="short_answer">Short Answer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Question</Label>
                    <Textarea
                      value={question.question}
                      onChange={(e) => handleQuestionChange(index, "question", e.target.value)}
                      data-testid={`input-question-${index}`}
                    />
                  </div>

                  {question.type === "multiple_choice" && (
                    <div className="space-y-2">
                      <Label>Options</Label>
                      {question.options?.map((option, optIndex) => (
                        <div key={optIndex} className="flex gap-2">
                          <Input
                            value={option}
                            onChange={(e) => handleOptionChange(index, optIndex, e.target.value)}
                            data-testid={`input-option-${index}-${optIndex}`}
                          />
                          {(question.options?.length || 0) > 2 && (
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => removeOption(index, optIndex)}
                              data-testid={`button-remove-option-${index}-${optIndex}`}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addOption(index)}
                        data-testid={`button-add-option-${index}`}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Option
                      </Button>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Correct Answer</Label>
                    {question.type === "true_false" ? (
                      <Select
                        value={question.correctAnswer}
                        onValueChange={(value) => handleQuestionChange(index, "correctAnswer", value)}
                      >
                        <SelectTrigger data-testid={`select-answer-${index}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="True">True</SelectItem>
                          <SelectItem value="False">False</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : question.type === "multiple_choice" ? (
                      <Select
                        value={question.correctAnswer}
                        onValueChange={(value) => handleQuestionChange(index, "correctAnswer", value)}
                      >
                        <SelectTrigger data-testid={`select-answer-${index}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {question.options?.map((opt, i) => (
                            <SelectItem key={i} value={opt}>{opt}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        value={question.correctAnswer}
                        onChange={(e) => handleQuestionChange(index, "correctAnswer", e.target.value)}
                        data-testid={`input-answer-${index}`}
                      />
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Explanation (optional)</Label>
                    <Textarea
                      value={question.explanation || ""}
                      onChange={(e) => handleQuestionChange(index, "explanation", e.target.value)}
                      placeholder="Explain why this is the correct answer"
                      data-testid={`input-explanation-${index}`}
                    />
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleSave} disabled={isSaving} data-testid="button-save-quiz">
            <Save className="h-4 w-4 mr-1" />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
          <Button onClick={handleStartQuiz} data-testid="button-start-quiz">
            Start Quiz
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
