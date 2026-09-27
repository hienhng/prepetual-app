const fs = require('fs');
function edit(path, fn) { const old=fs.readFileSync(path,'utf8'); const s=old.replace(/\r\n/g,'\n'); const next=fn(s); fs.writeFileSync(path, old.includes('\r\n') ? next.replace(/\n/g,'\r\n') : next); }
function rep(s,a,b) { if(!s.includes(a)) throw new Error('Missing '+a.slice(0,100)); return s.replaceAll(a,b); }
edit('shared/schema.ts',s=>{
 s='import { isValidSelectionQuestion } from "./selection-answer.js";\n'+s;
 s=rep(s,'"multiple_choice" | "true_false" | "short_answer"','"multiple_choice" | "selection" | "true_false" | "short_answer"');
 s=rep(s,'["multiple_choice", "true_false", "short_answer"]','["multiple_choice", "selection", "true_false", "short_answer"]');
 s=rep(s,'.max(3)\n    .refine((types)', '.max(4)\n    .refine((types)');
 return rep(s,'export type Question = z.infer<typeof questionSchema>;', 'export const validatedQuestionSchema = questionSchema.refine(\n  question => question.type !== "selection" || isValidSelectionQuestion(question),\n  { message: "Selection questions need distinct, nonempty options and at least two correct options.", path: ["correctAnswer"] },\n);\n\nexport type Question = z.infer<typeof questionSchema>;');
});
for(const path of ['client/src/pages/create.tsx','client/src/components/quiz-generator.tsx']) edit(path,s=>{
 s=rep(s,'"multiple_choice" | "true_false" | "short_answer"','"multiple_choice" | "selection" | "true_false" | "short_answer"');
 const marker=path.includes('pages/') ? '                      <div\n                        onClick={() => toggleQuestionType("true_false")}' : '                  <div\n                    className={`flex items-center gap-3 p-4 rounded-md border-2 cursor-pointer transition-all ${questionTypes.includes("true_false")';
 const block=`<label className={\`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer \${questionTypes.includes("selection") ? "border-primary bg-primary/5" : "border-border/50"}\`}>
                        <Checkbox checked={questionTypes.includes("selection")} onCheckedChange={() => toggleQuestionType("selection")} data-testid="option-selection" />
                        <span><span className="text-sm font-semibold">Selection</span><span className="block text-xs text-muted-foreground">Multiple correct answers</span></span>
                      </label>
`;
 return rep(s,marker,block+marker);
});
edit('client/src/lib/language-context.tsx',s=>{
 s=rep(s,'multipleChoice: "Multiple Choice",','selection: "Selection",\n      selectionHint: "Select all correct answers.",\n      selectionValidation: "Use distinct, nonempty options and tick at least two correct answers.",\n      multipleChoice: "Multiple Choice",');
 return rep(s,'multipleChoice: "Trắc nghiệm",','selection: "Chọn nhiều đáp án",\n      selectionHint: "Chọn tất cả đáp án đúng.",\n      selectionValidation: "Nhập các lựa chọn khác nhau, không để trống và chọn ít nhất hai đáp án đúng.",\n      multipleChoice: "Trắc nghiệm",');
});
edit('client/src/components/quiz-player.tsx',s=>{
 s='import { parseSelectionAnswer, encodeSelectionAnswer, selectionAnswersMatch, isCorrectOption, formatAnswer } from "@shared/selection-answer";\n'+s;
 s=rep(s,'if (!answer || !correctAnswer) return false;','if (!answer || !correctAnswer) return false;\n  if (type === "selection") return selectionAnswersMatch(answer, correctAnswer);');
 s=rep(s,'const handleSelectAnswer = (answer: string) => {\n    if (isChecked) return;','const handleSelectAnswer = (answer: string) => {\n    if (isChecked) return;\n    if (currentQuestion.type === "selection") {\n      const selected = parseSelectionAnswer(selectedAnswer);\n      answer = encodeSelectionAnswer(selected.includes(answer) ? selected.filter(option => option !== answer) : [...selected, answer]);\n    }');
 s=rep(s,'case "multiple_choice":','case "selection":\n        return t("quizGenerator.selection");\n      case "multiple_choice":');
 s=rep(s,'const isSelected = selectedAnswer === option;', 'const isSelected = currentQuestion.type === "selection" ? parseSelectionAnswer(selectedAnswer).includes(option) : selectedAnswer === option;');
 s=rep(s,'option.toLowerCase().trim() === currentQuestion.correctAnswer.toLowerCase().trim()', 'isCorrectOption(option, currentQuestion)');
 s=rep(s,'opt.toLowerCase().trim() === qSnap.correctAnswer.toLowerCase().trim()', 'isCorrectOption(opt, qSnap)');
 s=rep(s,'const isSelectedWrong = opt === answerToCheck && !correct;', 'const isSelectedWrong = (qSnap.type === "selection" ? parseSelectionAnswer(answerToCheck).includes(opt) : opt === answerToCheck) && !correct;');
 s=rep(s,'qSnap.type === "multiple_choice") {','(qSnap.type === "multiple_choice" || qSnap.type === "selection")) {');
 s=rep(s,'optionText.toLowerCase().trim() === qSnap.correctAnswer.toLowerCase().trim()', 'isCorrectOption(optionText, qSnap)');
 s=rep(s,'correctAnswer: qSnap.correctAnswer,','correctAnswer: formatAnswer(qSnap.correctAnswer, qSnap.type),');
 s=rep(s,'selectedAnswer: ansToCheck,','selectedAnswer: formatAnswer(ansToCheck, qSnap.type),');
 s=rep(s,'{currentQuestion.options?.map((option, index) => {','{currentQuestion.type === "selection" && <p className="text-sm text-muted-foreground">{t("quizGenerator.selectionHint")}</p>}\n        {currentQuestion.options?.map((option, index) => {');
 s=rep(s,'data-testid={`option-${index}`}','role={currentQuestion.type === "selection" ? "checkbox" : undefined}\n                aria-checked={currentQuestion.type === "selection" ? isSelected : undefined}\n                data-testid={`option-${index}`}');
 s=rep(s,'{optionLabels[index]}','{currentQuestion.type === "selection" ? <span aria-hidden="true" className="flex h-5 w-5 items-center justify-center rounded border-2 border-current">{isSelected && <Check className="h-4 w-4" />}</span> : optionLabels[index]}');
 return s;
});
edit('client/src/components/quiz-results.tsx',s=>{
 s='import { formatAnswer, selectionAnswersMatch } from "@shared/selection-answer";\n'+s;
 s=rep(s,': userAnswer?.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim();',': question.type === "selection" ? selectionAnswersMatch(userAnswer, question.correctAnswer) : userAnswer?.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim();');
 s=rep(s,'content={userAnswer || t(\'quizResults.noAnswerProvided\')}', 'content={formatAnswer(userAnswer, question.type) || t(\'quizResults.noAnswerProvided\')}');
 return rep(s,'content={question.correctAnswer}', 'content={formatAnswer(question.correctAnswer, question.type)}');
});
edit('client/src/lib/quiz-pdf.tsx',s=>{
 s=rep(s,': question.type === "multiple_choice" ? question.options',': (question.type === "multiple_choice" || question.type === "selection") ? question.options');
 s=rep(s,'{options.map((option, optionIndex)', '{question.type === "selection" && <p>Select all correct answers.</p>}\n        {options.map((option, optionIndex)');
 return rep(s,'{String.fromCharCode(65 + optionIndex)}.', '{question.type === "selection" ? "☐" : `${String.fromCharCode(65 + optionIndex)}.`}');
});
edit('server/routes.ts',s=>{
 s='import { selectionAnswersMatch } from "../shared/selection-answer.js";\nimport { validatedQuestionSchema } from "../shared/schema.js";\n'+s;
 s=rep(s,'correct: userAnswer.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim()', 'correct: question.type === "selection" ? selectionAnswersMatch(userAnswer, question.correctAnswer) : userAnswer.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim()');
 s=rep(s,'if (Array.isArray(questions)) {\n        const pendingIds', 'if (questions !== undefined) {\n        const validation = z.array(validatedQuestionSchema).safeParse(questions);\n        if (!validation.success) return res.status(400).json({ message: validation.error.issues[0].message });\n      }\n      if (Array.isArray(questions)) {\n        const pendingIds');
 return rep(s,'The student answered a multiple choice or true/false question.', 'The student answered a multiple choice, selection (select all correct options), or true/false question. A selection answer is correct only if every correct option and no incorrect option is selected.');
});
