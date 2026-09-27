const fs=require('fs');
function edit(path,fn){const old=fs.readFileSync(path,'utf8');const next=fn(old.replace(/\r\n/g,'\n'));fs.writeFileSync(path,old.includes('\r\n')?next.replace(/\n/g,'\r\n'):next)}
function rep(s,a,b){if(!s.includes(a))throw Error('Missing '+a.slice(0,100));return s.replaceAll(a,b)}
edit('server/routes.ts',s=>rep(s,'z.array(validatedQuestionSchema)','validatedQuestionSchema.array()'));
edit('client/src/pages/edit-quiz.tsx',s=>{
 s='import { parseSelectionAnswer, encodeSelectionAnswer, isValidSelectionQuestion, isCorrectOption } from "@shared/selection-answer";\n'+s;
 s=rep(s,'"all" | "multiple_choice"','"all" | "selection" | "multiple_choice"');
 s=rep(s,'const stats = { multiple_choice: 0,','const stats = { selection: 0, multiple_choice: 0,');
 s=rep(s,'options: type === "multiple_choice"','options: (type === "multiple_choice" || type === "selection")');
 s=rep(s,'correctAnswer: type === "multiple_choice"','correctAnswer: type === "selection" ? encodeSelectionAnswer(["A) Option 1", "B) Option 2"]) : type === "multiple_choice"');
 s=rep(s,'const options = [...(updated[questionIndex].options || [])];\n    options[optionIndex] = value;',`const options = [...(updated[questionIndex].options || [])];
    if (updated[questionIndex].type === "selection") {
      const correct = parseSelectionAnswer(updated[questionIndex].correctAnswer);
      updated[questionIndex] = { ...updated[questionIndex], correctAnswer: encodeSelectionAnswer(correct.map(option => option === options[optionIndex] ? value : option)) };
    }
    options[optionIndex] = value;`);
 s=rep(s,'options.splice(optionIndex, 1);',`if (updated[questionIndex].type === "selection") {
      updated[questionIndex] = { ...updated[questionIndex], correctAnswer: encodeSelectionAnswer(parseSelectionAnswer(updated[questionIndex].correctAnswer).filter(option => option !== options[optionIndex])) };
    }
    options.splice(optionIndex, 1);`);
 s=rep(s,'const handleSave = async (): Promise<boolean> => {','const handleSave = async (): Promise<boolean> => {\n    if (questions.some(question => question.type === "selection" && !isValidSelectionQuestion(question))) {\n      toast({ title: t("common.error"), description: t("quizGenerator.selectionValidation"), variant: "destructive" });\n      return false;\n    }');
 s=rep(s,'case "multiple_choice": return "default";', 'case "selection": return "default";\n      case "multiple_choice": return "default";');
 s=rep(s,'case "multiple_choice": return "MC";', 'case "selection": return t("quizGenerator.selection");\n      case "multiple_choice": return "MC";');
 s=rep(s,'{questionStats.multiple_choice > 0 && (','{questionStats.selection > 0 && <Badge variant="default">{t("quizGenerator.selection")}: {questionStats.selection}</Badge>}\n                {questionStats.multiple_choice > 0 && (');
 s=rep(s,'<SelectItem value="multiple_choice">','<SelectItem value="selection">{t("quizGenerator.selection")}</SelectItem>\n                    <SelectItem value="multiple_choice">');
 s=rep(s,'<DropdownMenuItem onClick={() => addQuestion("multiple_choice")}>','<DropdownMenuItem onClick={() => addQuestion("selection")}><CheckSquare className="h-4 w-4 mr-2" />{t("quizGenerator.selection")}</DropdownMenuItem>\n                      <DropdownMenuItem onClick={() => addQuestion("multiple_choice")}>');
 s=rep(s,'if (value === "true_false") {',`if (value === "selection") {
                                          const options = question.options?.length && question.type === "multiple_choice" ? question.options : ["Option 1", "Option 2", "Option 3", "Option 4"];
                                          handleQuestionChange(index, "options", options);
                                          handleQuestionChange(index, "correctAnswer", encodeSelectionAnswer(options.slice(0, 2)));
                                        } else if (question.type === "selection" && value === "multiple_choice") {
                                          handleQuestionChange(index, "correctAnswer", parseSelectionAnswer(question.correctAnswer)[0] || question.options?.[0] || "");
                                        } else if (value === "true_false") {`);
 s=rep(s,'handleQuestionChange(index, "options", undefined);', 'handleQuestionChange(index, "options", undefined);\n                                          if (question.type === "selection") handleQuestionChange(index, "correctAnswer", parseSelectionAnswer(question.correctAnswer)[0] || "");');
 s=rep(s,'question.type !== "multiple_choice" && !question.importReview','question.type !== "multiple_choice" && question.type !== "selection" && !question.importReview');
 s=rep(s,'{question.type === "multiple_choice" && (','{(question.type === "multiple_choice" || question.type === "selection") && (');
 s=rep(s,'{t(\'editQuiz.answerOptionsReorder\')}','{question.type === "selection" ? t("quizGenerator.selectionHint") : t(\'editQuiz.answerOptionsReorder\')}');
 s=rep(s,'option === question.correctAnswer', 'isCorrectOption(option, question)');
 s=rep(s,'<div key={optIndex} className="flex gap-2 items-center group">',`<div key={optIndex} className="flex gap-2 items-center group">
                                          {question.type === "selection" && <Checkbox aria-label={"Correct option " + (optIndex + 1)} checked={isCorrectOption(option, question)} onCheckedChange={checked => {
                                            const correct = parseSelectionAnswer(question.correctAnswer);
                                            handleQuestionChange(index, "correctAnswer", encodeSelectionAnswer(checked ? [...correct, option] : correct.filter(answer => answer !== option)));
                                          }} />}`);
 s=rep(s,'{question.importReview ? <Input','{(question.importReview || question.type === "selection") ? <Input');
 s=rep(s,'{question.importReview && <Button size="icon"','{(question.importReview || question.type === "selection") && <Button size="icon"');
 s=rep(s,'{question.importReview && <Button size="sm"','{(question.importReview || question.type === "selection") && <Button size="sm"');
 s=rep(s,'{questions[previewIndex].type === "multiple_choice" && (','{(questions[previewIndex].type === "multiple_choice" || questions[previewIndex].type === "selection") && (');
 s=rep(s,'option === questions[previewIndex].correctAnswer','isCorrectOption(option, questions[previewIndex])');
 s=rep(s,') : (\n                      <RadioGroup',`) : questions[reviseDialogIndex]?.type === "selection" ? (
                      <div className="space-y-2">
                        <p>{t("quizGenerator.selectionHint")}</p>
                        {questions[reviseDialogIndex].options?.map((option, i) => <label key={i} className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer">
                          <Checkbox checked={parseSelectionAnswer(reviseSelectedAnswer).includes(option)} onCheckedChange={checked => {
                            const correct = parseSelectionAnswer(reviseSelectedAnswer);
                            setReviseSelectedAnswer(encodeSelectionAnswer(checked ? [...correct, option] : correct.filter(answer => answer !== option)));
                          }} />
                          <MathText content={option} />
                        </label>)}
                      </div>
                    ) : (
                      <RadioGroup`);
 return rep(s,'disabled={!reviseSelectedAnswer}', 'disabled={!reviseSelectedAnswer || (reviseDialogIndex !== null && questions[reviseDialogIndex]?.type === "selection" && parseSelectionAnswer(reviseSelectedAnswer).length < 2)}');
});
