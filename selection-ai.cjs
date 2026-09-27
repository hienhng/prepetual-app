const fs=require('fs');
function edit(path,fn){const old=fs.readFileSync(path,'utf8');const next=fn(old.replace(/\r\n/g,'\n'));fs.writeFileSync(path,old.includes('\r\n')?next.replace(/\n/g,'\r\n'):next)}
function rep(s,a,b){if(!s.includes(a))throw Error('Missing '+a.slice(0,100));return s.replaceAll(a,b)}
edit('server/quiz-generation-policy.ts',s=>{
 s='import { encodeSelectionAnswer, parseSelectionAnswer, isValidSelectionQuestion } from "../shared/selection-answer.js";\n'+s;
 s=rep(s,'if (!correctAnswer || !explanation) return true;', 'if (question.type === "selection") return !explanation || !isValidSelectionQuestion({ options: Array.isArray(question.options) ? question.options : [], correctAnswer: encodeSelectionAnswer(parseSelectionAnswer(question.correctAnswer)) });\n  if (!correctAnswer || !explanation) return true;');
 return rep(s,'const result = { ...candidate };', 'const result = { ...candidate };\n  if (result.type === "selection") {\n    result.correctAnswer = encodeSelectionAnswer(parseSelectionAnswer(result.correctAnswer).map(answer => answer.trim()));\n    if (Array.isArray(result.options)) result.options = result.options.map((option: unknown) => typeof option === "string" ? option.trim() : option);\n  }');
});
edit('server/openai.ts',s=>{
 s='import { encodeSelectionAnswer, parseSelectionAnswer, isValidSelectionQuestion, selectionAnswersMatch, formatAnswer } from "../shared/selection-answer.js";\n'+s;
 s=rep(s,'["multiple_choice", "true_false", "short_answer"]','["multiple_choice", "selection", "true_false", "short_answer"]');
 s=rep(s,'"type": "multiple_choice" | "true_false" | "short_answer"','"type": "multiple_choice" | "selection" | "true_false" | "short_answer"');
 s=rep(s,'case "multiple_choice":','case "selection":\n          return "Selection questions: select all correct options; at least two correct answers";\n        case "multiple_choice":');
 s=rep(s,'- multiple_choice: create exactly four', '- selection: create four distinct substantive options with at least two correct options and at least one incorrect option. Ask the learner to select ALL correct answers in the question language. Return correctAnswer as a JSON array of exact correct option texts, and optionVerdicts as booleans identifying every correct option.\n- multiple_choice: create exactly four');
 s=rep(s,'Exactly one verdict must be true, and it must belong to correctAnswer.', 'For multiple_choice and true_false, exactly one verdict must be true and belong to correctAnswer. For selection, at least two verdicts must be true and exactly match the correctAnswer array.');
 s=rep(s,'- For multiple-choice questions, create exactly four', '- For selection questions, create four distinct substantive options with at least two correct answers and at least one incorrect option. Ask to select ALL correct answers in the question language. Return correctAnswer as a JSON array containing every exact correct option text.\n- For multiple-choice questions, create exactly four');
 s=rep(s,'- For multiple_choice, return exactly four', '- For selection, return four distinct substantive options, at least two correct options and at least one incorrect option. Ask to select ALL correct answers in the question language. correctAnswer must be a JSON array of the exact correct option texts.\n- For multiple_choice, return exactly four');
 s=rep(s,'4. The question is valid only when EXACTLY ONE option satisfies the stem','4. For multiple_choice and true_false, EXACTLY ONE option must satisfy the stem. For selection, at least TWO options must satisfy the stem; return every correct index in satisfyingOptionIndexes and use null for correctOptionIndex.');
 s=rep(s,'- Reject a question when zero, two, three, or four options could reasonably be correct','- For multiple_choice and true_false, reject a question when zero or multiple options could reasonably be correct. For selection, require at least two correct options and reject ambiguous or unverifiable options.');
 s=rep(s,'- Reject broad property/category stems when multiple options share the property','- For single-answer questions, reject broad property/category stems when multiple options share the property');
 s=rep(s,'const verifiedAnswer = options[verifiedIndex];','const verifiedAnswer = q.type === "selection" ? encodeSelectionAnswer(satisfyingIndexes.map((index: number) => options[index])) : options[verifiedIndex];');
 s=rep(s,'v.isUnambiguous !== true || satisfyingIndexes.length !== 1 || !Number.isInteger(v.correctOptionIndex)', 'v.isUnambiguous !== true || (q.type === "selection"\n              ? satisfyingIndexes.length < 2 || satisfyingIndexes.length !== v.satisfyingOptionIndexes?.length || new Set(satisfyingIndexes).size !== satisfyingIndexes.length\n              : satisfyingIndexes.length !== 1 || !Number.isInteger(v.correctOptionIndex))');
 s=rep(s,'if (verifiedIndex !== satisfyingIndexes[0] || verifiedIndex < 0 || verifiedIndex >= options.length)', 'if (q.type !== "selection" && (verifiedIndex !== satisfyingIndexes[0] || verifiedIndex < 0 || verifiedIndex >= options.length))');
 s=rep(s,'[verifiedAnswer, auditedExplanation]', '[formatAnswer(verifiedAnswer, q.type), auditedExplanation]');
 s=rep(s,'let correctAnswer = typeof result.correctAnswer === "string" ? result.correctAnswer.trim() : "";', 'let correctAnswer = q.type === "selection" ? encodeSelectionAnswer(parseSelectionAnswer(result.correctAnswer)) : typeof result.correctAnswer === "string" ? result.correctAnswer.trim() : "";');
 s=rep(s,'[q.question, correctAnswer, explanation, ...rawOptions]', '[q.question, formatAnswer(correctAnswer, q.type), explanation, ...rawOptions]');
 s=rep(s,'if (q.type === "multiple_choice") {\n        const normalizedAnswerSet', `if (q.type === "selection") {
        const verdictAnswers = rawOptions.filter((_: string, index: number) => optionVerdicts[index] === true);
        if (!isValidSelectionQuestion({ options: rawOptions, correctAnswer }) || rawOptions.length !== 4 ||
            getMultipleChoiceOptionQualityIssue(rawOptions) || optionVerdicts.length !== rawOptions.length ||
            optionVerdicts.some((verdict: unknown) => typeof verdict !== "boolean") ||
            !selectionAnswersMatch(encodeSelectionAnswer(verdictAnswers), correctAnswer)) {
          rejectedQuestions.add(q);
          continue;
        }
        q.options = rawOptions;
        q.correctAnswer = correctAnswer;
      } else if (q.type === "multiple_choice") {
        const normalizedAnswerSet`);
 s=rep(s,'q.type === "multiple_choice" && Array.isArray(q.options)', '(q.type === "multiple_choice" || q.type === "selection") && Array.isArray(q.options)');
 s=rep(s,'correctAnswer = maybeFixShiftedDigitSymbols(correctAnswer);', 'correctAnswer = q.type === "selection" ? encodeSelectionAnswer(parseSelectionAnswer(correctAnswer).map(maybeFixShiftedDigitSymbols)) : maybeFixShiftedDigitSymbols(correctAnswer);');
 s=rep(s,'if (q.type === "multiple_choice") {\n          if (!options', `if (q.type === "selection") {
          if (!isValidSelectionQuestion({ options, correctAnswer }) || options?.length !== 4 || getMultipleChoiceOptionQualityIssue(options)) continue;
        } else if (q.type === "multiple_choice") {
          if (!options`);
 s=rep(s,'q.type === "multiple_choice" && options && options.length > 0','(q.type === "multiple_choice" || q.type === "selection") && options && options.length > 0');
 s=rep(s,'q.type === "multiple_choice" || q.type === "true_false"','q.type === "multiple_choice" || q.type === "selection" || q.type === "true_false"');
 s=rep(s,'q?.type === "multiple_choice" || q?.type === "true_false"','q?.type === "multiple_choice" || q?.type === "selection" || q?.type === "true_false"');
 s=rep(s,'            const completion = await openai.chat.completions.create({\n              model: quizModel,', `            if (q.type === "selection") {
              systemPrompt += "\\nThis is a selection question. Multiple options are correct. Determine every correct option, returning correctAnswer as a JSON array of exact option texts with at least two entries. Any supplied user answer is the full set, encoded as a JSON array. Explain all correct options and only mark unselected incorrect options as wrong.";
            }
            const completion = await openai.chat.completions.create({
              model: quizModel,`);
 s=rep(s,'const finalAnswer = userCorrectAnswer || parsed.correctAnswer;', 'const finalAnswer = q.type === "selection" ? encodeSelectionAnswer(parseSelectionAnswer(userCorrectAnswer || parsed.correctAnswer)) : userCorrectAnswer || parsed.correctAnswer;\n            if (q.type === "selection" && !isValidSelectionQuestion({ options: q.options, correctAnswer: finalAnswer })) throw new Error("Invalid selection answer set");');
 s=rep(s,'if (!userCorrectAnswer && q.options && !q.options.includes(resolvedAnswer))', 'if (q.type !== "selection" && !userCorrectAnswer && q.options && !q.options.includes(resolvedAnswer))');
 return s;
});
