const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');
const path = require('node:path');
const dictionaryPath = 'client/src/lib/language-context.tsx';
const dictionaryText = fs.readFileSync(dictionaryPath, 'utf8');
const source = ts.createSourceFile(dictionaryPath, dictionaryText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let initializer;
function visitDictionary(node) {
  if (ts.isVariableDeclaration(node) && node.name.getText(source) === 'dictionaries') initializer = node.initializer;
  ts.forEachChild(node, visitDictionary);
}
visitDictionary(source);
const dictionaries = vm.runInNewContext('(' + initializer.getText(source) + ')');
const entries = {};
const replacements = new Map();
function add(key, en, vi) {
  entries[key] = { en, vi };
  replacements.set(en, key);
}
const sections = {
  common: {
    proceed: ['Proceed', 'Tiếp tục'], dismiss: ['Dismiss', 'Đóng'], close: ['Close', 'Đóng'], copy: ['Copy', 'Sao chép'],
    and: ['and', 'và'], or: ['Or', 'Hoặc'], complete: ['Complete', 'Hoàn tất'], skip: ['Skip', 'Bỏ qua'],
    expandedView: ['Expanded view', 'Chế độ xem phóng to'], images: ['Images', 'Hình ảnh'],
  },
  create: {
    addedMaterials: ['Added Materials', 'Tài liệu đã thêm'], openMaterials: ['Open Added Materials Panel', 'Mở bảng tài liệu đã thêm'],
    configuration: ['Quiz Configuration', 'Thiết lập bài quiz'], configurationDescription: ['Configure practice options and review added materials.', 'Thiết lập cách luyện tập và xem lại tài liệu đã thêm.'],
    noMaterials: ['No materials added yet.', 'Chưa có tài liệu nào.'], noMaterialsHint: ['Upload a doc, paste text notes, or enter a prompt.', 'Tải tài liệu lên, dán ghi chú hoặc nhập yêu cầu.'],
    uploadedDocument: ['Uploaded document', 'Tài liệu đã tải lên'], pastedTextLabel: ['Pasted text', 'Văn bản đã dán'], youtubeLinkLabel: ['YouTube video link', 'Liên kết video YouTube'], promptLabel: ['Prompt', 'Yêu cầu'],
    quizSettings: ['Quiz Settings', 'Cài đặt bài quiz'], quizSettingsDescription: ['Configure your quiz generation preferences', 'Thiết lập các tùy chọn tạo bài quiz'],
    practiceMode: ['Practice Mode', 'Chế độ luyện tập'], originalQuestions: ['AI creates original quiz questions from materials.', 'AI tạo câu hỏi mới từ tài liệu của bạn.'],
    importExam: ['Import Exam', 'Nhập đề kiểm tra'], originalFormats: ['Import questions in their original exam formats.', 'Nhập câu hỏi theo định dạng của đề gốc.'],
    retryPromptSettings: ['Retry prompt settings', 'Thử đọc lại yêu cầu'], detectingSettings: ['Reading count and difficulty from your prompt…', 'Đang đọc số câu hỏi và độ khó từ yêu cầu…'],
    quizOptions: ['Quiz Options', 'Tùy chọn bài quiz'], questionFormats: ['Question Formats', 'Định dạng câu hỏi'],
    fourOptions: ['4 options', '4 lựa chọn'], multiSelection: ['Multi-selection', 'Chọn nhiều đáp án'], binary: ['Binary', 'Chọn đúng hoặc sai'], openRecall: ['Open recall', 'Tự viết câu trả lời'],
    howImportWorks: ['How Import Mode Works', 'Cách nhập đề kiểm tra'],
    importHelp: ['Upload or paste an existing exam. Import multiple-choice, selection, true/false, and short-answer questions. Grouped true/false statements become selection questions. Uncertain layouts or answers are flagged for review.', 'Tải lên hoặc dán đề kiểm tra có sẵn để nhập câu hỏi trắc nghiệm, chọn nhiều đáp án, đúng/sai và trả lời ngắn. Các nhóm phát biểu đúng/sai được chuyển thành câu hỏi chọn nhiều đáp án. Câu hỏi có bố cục hoặc đáp án chưa rõ sẽ được đánh dấu để kiểm tra.'],
    supportedFormats: ['Supported Formats:', 'Định dạng được hỗ trợ:'], pdfDocuments: ['PDF documents', 'Tài liệu PDF'], wordDocuments: ['Word documents (.docx, .doc)', 'Tài liệu Word (.docx, .doc)'],
    presentations: ['PowerPoint presentations (.pptx, .ppt)', 'Bài trình chiếu PowerPoint (.pptx, .ppt)'], imageFormats: ['Images (JPG, PNG)', 'Hình ảnh (JPG, PNG)'], textNotes: ['Text notes', 'Ghi chú văn bản'],
    backToMaterials: ['Back to Materials', 'Quay lại tài liệu'], readingSettings: ['Reading prompt settings…', 'Đang đọc yêu cầu…'], startGenerating: ['Start Generating Quiz', 'Bắt đầu tạo bài quiz'],
    closeUpload: ['Close upload?', 'Đóng cửa sổ tải lên?'], closeUploadDescription: ['Your uploaded files are still in the list. Closing this dialog may disrupt their upload progress.', 'Các tệp tải lên vẫn còn trong danh sách. Đóng cửa sổ này có thể làm gián đoạn quá trình tải lên.'],
    keepUploading: ['Keep uploading', 'Tiếp tục tải lên'], closeDialog: ['Close dialog', 'Đóng cửa sổ'], removeFile: ['Remove {name}', 'Xóa {name}'],
  },
  fileUpload: {
    preview: ['File preview', 'Xem trước tệp'], previewDescription: ['Review your files, then click Proceed to add them to your materials.', 'Kiểm tra các tệp rồi nhấn Tiếp tục để thêm vào tài liệu học tập.'],
    addMore: ['Add more files', 'Thêm tệp'], dropHere: ['Drop files here', 'Thả tệp vào đây'], onlyProcessed: ['Only successfully processed files will be added.', 'Chỉ các tệp đã xử lý thành công mới được thêm.'],
    release: ['Release to Upload', 'Thả để tải lên'], uploadMaterials: ['Upload your materials', 'Tải tài liệu của bạn lên'], dragDrop: ['Drag and drop your files or', 'Kéo và thả tệp hoặc'], browse: ['click to browse', 'nhấn để chọn tệp'],
    extracting: ['Extracting available text and preserving visuals', 'Đang trích xuất văn bản và giữ lại hình ảnh'], failed: ['Upload failed', 'Tải lên thất bại'],
    cancelUpload: ['Cancel upload?', 'Hủy tải lên?'], cancelDescription: ['Are you sure you want to cancel the document processing?', 'Bạn có chắc muốn hủy xử lý tài liệu?'], keep: ['No, keep it', 'Tiếp tục xử lý'], confirmCancel: ['Yes, cancel', 'Hủy xử lý'], reviewFiles: ['Review files', 'Kiểm tra tệp'],
    filesCount: ['{count} files', '{count} tệp'], processingCount: ['Processing {current} of {total} files...', 'Đang xử lý {current}/{total} tệp...'], completedFailed: ['{completed} completed, {failed} failed', '{completed} tệp hoàn tất, {failed} tệp thất bại'], failedCount: ['{count} file(s) failed', '{count} tệp thất bại'], readyCount: ['{count} files ready', '{count} tệp đã sẵn sàng'], reviewCount: ['Review {count} files', 'Kiểm tra {count} tệp'],
    processing: ['Processing files...', 'Đang xử lý tệp...'], preparing: ['Preparing files...', 'Đang chuẩn bị tệp...'], sizeUnavailable: ['Size unavailable', 'Không có thông tin kích thước'], sizeLimit: ['File Size Limit Exceeded', 'Vượt quá giới hạn kích thước tệp'],
    combinedLimit: ['The combined upload must be 50 MB or smaller.', 'Tổng kích thước tải lên phải từ 50 MB trở xuống.'], singleLimit: ['Each file must be 50 MB or smaller.', 'Mỗi tệp phải có kích thước từ 50 MB trở xuống.'], processingError: ['An error occurred while processing files', 'Đã xảy ra lỗi khi xử lý tệp'], uploadError: ['An error occurred while uploading files', 'Đã xảy ra lỗi khi tải tệp lên'],
  },
  materialPane: {
    summary: ['Study summary', 'Tóm tắt tài liệu học tập'], showingSummary: ['Showing AI summary', 'Đang hiển thị tóm tắt của AI'], extractedText: ['Extracted text', 'Văn bản đã trích xuất'], sourceImages: ['Source images', 'Hình ảnh gốc'],
    original: ['View original', 'Xem bản gốc'], viewSummary: ['View summary', 'Xem tóm tắt'], summarizing: ['Summarizing...', 'Đang tóm tắt...'], summarize: ['Summarize', 'Tóm tắt'], summarizeMaterial: ['Summarize material', 'Tóm tắt tài liệu'],
    disclaimer: ['AI generated content might be inaccurate. Check for mistakes.', 'Nội dung do AI tạo có thể không chính xác. Hãy kiểm tra lại.'], summaryError: ['Failed to summarize material. Please try again.', 'Không thể tóm tắt tài liệu. Vui lòng thử lại.'],
  },
  quizGenerator: {
    yourPrompt: ['Your Quiz Prompt', 'Yêu cầu tạo bài quiz của bạn'], combinedSources: ['Your Combined Quiz Sources', 'Các nguồn tạo bài quiz của bạn'], promptFocus: ['AI will use this request to choose the topic and focus', 'AI sẽ dùng yêu cầu này để chọn chủ đề và trọng tâm'], plusPrompt: [' plus your quiz prompt', ' cùng yêu cầu tạo bài quiz của bạn'],
    promptPracticeDescription: ['Prepetual creates original questions that follow your topic and focus.', 'Prepetual tạo câu hỏi mới theo chủ đề và trọng tâm của bạn.'], combinedPracticeDescription: ['Prepetual grounds questions in every source and follows your requested focus.', 'Prepetual tạo câu hỏi dựa trên mọi nguồn tài liệu và trọng tâm bạn yêu cầu.'],
    optionsDescription: ['Control the number of questions, difficulty, and quiz format before generating.', 'Chọn số câu hỏi, độ khó và định dạng bài quiz trước khi tạo.'], fourOptions: ['4 options per question', '4 lựa chọn cho mỗi câu hỏi'], multipleCorrect: ['Multiple correct answers', 'Nhiều đáp án đúng'], binaryDescription: ['Binary judgment questions', 'Câu hỏi chọn đúng hoặc sai'], recallDescription: ['Open-ended recall questions', 'Câu hỏi tự viết câu trả lời'], generate: ['Generate Quiz', 'Tạo bài quiz'],
    importDescription: ['Import multiple-choice, selection, true/false, and short-answer questions from an existing test. Grouped true/false statements become selection questions; uncertain layouts or answers are flagged for review.', 'Nhập câu hỏi trắc nghiệm, chọn nhiều đáp án, đúng/sai và trả lời ngắn từ đề có sẵn. Các nhóm phát biểu đúng/sai được chuyển thành câu hỏi chọn nhiều đáp án; câu hỏi có bố cục hoặc đáp án chưa rõ sẽ được đánh dấu để kiểm tra.'], import: ['Import Quiz', 'Nhập bài quiz'],
  },
  quizGeneration: {
    importing: ['Importing Quiz', 'Đang nhập bài quiz'], creating: ['Creating Quiz', 'Đang tạo bài quiz'], importProgress: ['Quiz import progress', 'Tiến độ nhập bài quiz'], generationProgress: ['Quiz generation progress', 'Tiến độ tạo bài quiz'],
    starting: ['Starting quiz generation...', 'Đang bắt đầu tạo bài quiz...'], reading: ['Reading your study material...', 'Đang đọc tài liệu học tập...'], analyzing: ['Analyzing content structure...', 'Đang phân tích cấu trúc nội dung...'], preparing: ['Preparing quiz generation...', 'Đang chuẩn bị tạo bài quiz...'], generating: ['AI is generating questions...', 'AI đang tạo câu hỏi...'], processing: ['Processing AI response...', 'Đang xử lý phản hồi của AI...'], validating: ['Validating generated questions...', 'Đang kiểm tra các câu hỏi đã tạo...'], finalizing: ['Finalizing your quiz...', 'Đang hoàn thiện bài quiz...'], saving: ['Saving your quiz...', 'Đang lưu bài quiz...'], complete: ['Quiz created successfully!', 'Đã tạo bài quiz thành công!'], default: ['Processing...', 'Đang xử lý...'],
    resumeSaved: ['Resume saved quiz · {generated}/{requested} questions', 'Tiếp tục bài quiz đã lưu · {generated}/{requested} câu hỏi'], continuing: ['Continuing your quiz…', 'Đang tiếp tục tạo bài quiz…'], continueQuestion: ['Continue generating?', 'Tiếp tục tạo câu hỏi?'], finishQuestion: ['Finish saving your quiz?', 'Hoàn tất lưu bài quiz?'], savedCount: ['{generated} of {requested} questions are validated and saved.', '{generated}/{requested} câu hỏi đã được kiểm tra và lưu.'], remaining: ['Generation stopped before reaching your requested count. Continue to generate the remaining {remaining}? Your saved questions will stay unchanged.', 'Quá trình tạo đã dừng trước khi đạt số câu hỏi bạn yêu cầu. Tiếp tục tạo {remaining} câu hỏi còn lại? Các câu hỏi đã lưu sẽ được giữ nguyên.'], readyToSave: ['Your questions are ready. Try finishing the save again.', 'Các câu hỏi đã sẵn sàng. Hãy thử hoàn tất lưu lại.'], checkingRemaining: ['Generating and checking the remaining questions…', 'Đang tạo và kiểm tra các câu hỏi còn lại…'], notNow: ['Not now', 'Để sau'], generatingShort: ['Generating…', 'Đang tạo…'], continueGeneration: ['Continue generation', 'Tiếp tục tạo'], finishSaving: ['Finish saving', 'Hoàn tất lưu'], resumeError: ['Could not resume generation.', 'Không thể tiếp tục tạo bài quiz.'], stoppedError: ['Generation stopped unexpectedly. Your saved questions are retained.', 'Quá trình tạo dừng đột ngột. Các câu hỏi đã lưu được giữ lại.'],
  },
  editQuiz: {
    reviewHelp: ['Check the original text, question layout, and correct answer for each flagged item. Unconfirmed answers will not be scored or published.', 'Kiểm tra văn bản gốc, bố cục câu hỏi và đáp án đúng của từng câu được đánh dấu. Các đáp án chưa xác nhận sẽ không được chấm điểm hoặc công bố.'], showFlagged: ['Show flagged questions', 'Hiện câu hỏi cần kiểm tra'], sourceImages: ['View source images and diagrams', 'Xem hình ảnh và sơ đồ gốc'], needsReview: ['Needs review', 'Cần kiểm tra'], originalText: ['Original source text', 'Văn bản gốc'], confirmAnswer: ['Confirm the correct answer', 'Xác nhận đáp án đúng'], enterAnswer: ['Enter the correct answer', 'Nhập đáp án đúng'], selectAllHelp: ['Select every correct option below. For grouped true/false statements, select the true statements.', 'Chọn tất cả đáp án đúng bên dưới. Với nhóm phát biểu đúng/sai, hãy chọn các phát biểu đúng.'], noTrueStatements: ['No statements are true', 'Không có phát biểu nào đúng'], selectCorrect: ['Select the correct option', 'Chọn đáp án đúng'], confirmQuestion: ['Confirm question and answer', 'Xác nhận câu hỏi và đáp án'], groupedStatements: ['Grouped true/false statements (any number may be true)', 'Nhóm phát biểu đúng/sai (có thể có nhiều phát biểu đúng)'], removeOption: ['Remove option', 'Xóa lựa chọn'], addOption: ['Add option', 'Thêm lựa chọn'], questionImage: ['Question image', 'Hình ảnh câu hỏi'], reviewSummary: ['All {total} questions are saved. {count} need review.', 'Đã lưu tất cả {total} câu hỏi. Có {count} câu cần kiểm tra.'],
  },
  quiz: {
    reviewImported: ['Review imported questions', 'Kiểm tra câu hỏi đã nhập'], reviewQuestions: ['Review questions', 'Kiểm tra câu hỏi'], reviewRequired: ['All {total} questions are saved. Confirm the {count} flagged questions and their answers before starting a scored quiz.', 'Đã lưu tất cả {total} câu hỏi. Hãy xác nhận {count} câu được đánh dấu và đáp án trước khi bắt đầu làm bài có chấm điểm.'],
  },
  chatbot: {
    welcome: ['Welcome to Prepal AI', 'Chào mừng đến với Prepal AI'], welcomeDescription: ["Ask me anything about this quiz and I'll help you master the material!", 'Hãy hỏi bất cứ điều gì về bài quiz này, mình sẽ giúp bạn nắm vững kiến thức!'], search: ['Search messages', 'Tìm tin nhắn'], searchPlaceholder: ['Search messages...', 'Tìm tin nhắn...'], closePanel: ['Close chat panel', 'Đóng bảng trò chuyện'], chatLabel: ['Prepal AI chat', 'Trò chuyện với Prepal AI'], noResults: ['No messages match your search.', 'Không có tin nhắn phù hợp với tìm kiếm.'], workThrough: ['Let’s work through it.', 'Cùng tìm hiểu nhé.'], hintDescription: ['A little stuck? Ask for a hint, unpack a concept, or try a new approach.', 'Chưa hiểu rõ? Hãy xin gợi ý, tìm hiểu khái niệm hoặc thử cách tiếp cận mới.'], start: ['A place to start', 'Bắt đầu từ đây'], suggestedQuestions: ['Suggested questions', 'Câu hỏi gợi ý'], askPlaceholder: ['Ask a question…', 'Nhập câu hỏi…'], messageLabel: ['Message Prepal AI', 'Gửi tin nhắn cho Prepal AI'], send: ['Send message', 'Gửi tin nhắn'], keyboardHint: ['Enter to send · Shift + Enter for a new line', 'Enter để gửi · Shift + Enter để xuống dòng'], conceptCue: ['Explain the concept behind this question', 'Giải thích khái niệm trong câu hỏi này'], hintCue: ['Give me a hint without revealing the answer', 'Cho mình gợi ý mà không tiết lộ đáp án'], topicsCue: ['What topics should I study more?', 'Mình nên học thêm những chủ đề nào?'], quizCue: ['Quiz me on this concept with a different question', 'Kiểm tra khái niệm này bằng một câu hỏi khác'],
  },
  study: {
    startHere: ['Start here', 'Bắt đầu tại đây'], wrapUp: ['Wrap up', 'Tổng kết'], testYourself: ['Test yourself', 'Tự kiểm tra'], openTopics: ['Open lecture topics', 'Mở danh sách chủ đề'], mainIdeaCue: ['Explain the main idea of this lecture slide', 'Giải thích ý chính của trang bài giảng này'], summaryCue: ['Summarize this topic in simple terms', 'Tóm tắt chủ đề này bằng ngôn ngữ đơn giản'], exampleCue: ['Give me an example that helps explain this lesson', 'Cho mình một ví dụ để hiểu bài học này'], quizCue: ['Quiz me on the material covered in this lecture', 'Kiểm tra kiến thức trong bài giảng này'],
  },
  share: {
    notFound: ['Quiz not found', 'Không tìm thấy bài quiz'], invalidLink: ['This quiz may have been deleted or the link is invalid', 'Bài quiz có thể đã bị xóa hoặc liên kết không hợp lệ'], sharedQuiz: ['Shared Quiz', 'Bài quiz được chia sẻ'], description: ['Someone shared a quiz with you', 'Có người đã chia sẻ bài quiz với bạn'], start: ['Start Quiz', 'Bắt đầu làm bài'], createYourOwn: ['Want to create your own quizzes?', 'Bạn muốn tạo bài quiz của riêng mình?'], getStarted: ['Get started', 'Bắt đầu'],
  },
};
for (const [section, values] of Object.entries(sections)) for (const [key, pair] of Object.entries(values)) add(`${section}.${key}`, ...pair);
// Prefer established translation keys for shared labels.
function existing(object, prefix = '') {
  for (const [key, value] of Object.entries(object)) {
    const full = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string' && !replacements.has(value)) replacements.set(value, full);
    else if (value && typeof value === 'object' && !Array.isArray(value)) existing(value, full);
  }
}
existing(dictionaries.en);
const missing = {
  'common.backToHome': 'Về trang chủ', 'common.goBack': 'Quay lại', 'common.footer': 'Prepetual', 'common.duplicate': 'Nhân bản câu hỏi', 'common.edit': 'Quay lại chỉnh sửa', 'common.add': 'Thêm', 'common.error': 'Lỗi', 'common.backToDashboard': 'Quay lại',
  'notFound.title': 'Có vẻ chúng ta bị lạc rồi...', 'notFound.description': 'Kiểm tra lại địa chỉ hoặc quay về trang chủ',
  'history.giveFolderName': 'Đặt tên cho thư mục', 'history.create': 'Tạo', 'history.folderName': 'Tên thư mục',
  'inProgress.noQuizzesInProgress': 'Chưa có bài quiz nào đang làm', 'inProgress.searchPlaceholder': 'Tìm bài quiz đang làm...', 'inProgress.searchResultsCount': '{count} kết quả', 'inProgress.noSearchResults': 'Không tìm thấy kết quả', 'inProgress.tryDifferentSearch': 'Thử từ khóa tìm kiếm khác', 'inProgress.clearSearch': 'Xóa tìm kiếm', 'inProgress.allSubjects': 'Tất cả môn học', 'inProgress.allDifficulties': 'Tất cả mức độ', 'inProgress.clearFilters': 'Xóa bộ lọc',
  'editQuiz.explanationPlaceholder': 'Nhập lời giải thích...', 'editQuiz.aiRevise': 'Chỉnh sửa bằng AI', 'editQuiz.imageRemoved': 'Đã xóa hình ảnh', 'editQuiz.questionDuplicated': 'Đã nhân bản câu hỏi', 'editQuiz.whichAnswerIsCorrect': 'Đáp án nào đúng?', 'editQuiz.aiReviseDesc': 'Mô tả cách bạn muốn AI chỉnh sửa câu hỏi.', 'editQuiz.reviseWithAi': 'Chỉnh sửa bằng AI', 'editQuiz.quizSaved': 'Đã lưu bài quiz', 'editQuiz.quizSavedDesc': 'Các thay đổi của bạn đã được lưu.',
};
function put(language, full, value) {
  const parts = full.split('.'); let current = dictionaries[language];
  for (const part of parts.slice(0, -1)) current = current[part] ||= {};
  current[parts.at(-1)] = value;
}
for (const [key, vi] of Object.entries(missing)) put('vi', key, vi);
for (const [key, pair] of Object.entries(entries)) for (const lang of ['en', 'vi']) put(lang, key, pair[lang]);
// Insert properties without rewriting the existing dictionary or unrelated changes.
const dictionaryEdits = [];
for (const languageNode of initializer.properties) {
  const lang = languageNode.name.getText(source);
  const additions = {};
  for (const [full, pair] of Object.entries(entries)) { const [section, key] = full.split('.'); (additions[section] ||= {})[key] = pair[lang]; }
  if (lang === 'vi') for (const [full, value] of Object.entries(missing)) { const [section, key] = full.split('.'); (additions[section] ||= {})[key] = value; }
  for (const [section, values] of Object.entries(additions)) {
    const sectionNode = languageNode.initializer.properties.find(node => node.name.getText(source) === section);
    if (sectionNode) {
      const text = Object.entries(values).map(([key, value]) => `\n      ${key}: ${JSON.stringify(value)},`).join('');
      dictionaryEdits.push({ start: sectionNode.initializer.getStart(source) + 1, end: sectionNode.initializer.getStart(source) + 1, text });
    } else {
      const text = `\n    ${section}: {${Object.entries(values).map(([key, value]) => `\n      ${key}: ${JSON.stringify(value)},`).join('')}\n    },`;
      dictionaryEdits.push({ start: languageNode.initializer.getStart(source) + 1, end: languageNode.initializer.getStart(source) + 1, text });
    }
  }
}
function apply(text, edits) { for (const edit of edits.sort((a,b) => b.start - a.start)) text = text.slice(0, edit.start) + edit.text + text.slice(edit.end); return text; }
fs.writeFileSync(dictionaryPath, apply(dictionaryText, dictionaryEdits));
const files = [
  'pages/create.tsx', 'pages/edit-quiz.tsx', 'pages/quiz.tsx', 'pages/study.tsx', 'pages/share.tsx',
  'components/file-upload.tsx', 'components/global-upload-indicator.tsx', 'components/material-pane.tsx',
  'components/quiz-generator.tsx', 'components/quiz-generation-dialog.tsx', 'components/quiz-generation-resume-dialog.tsx', 'components/quiz-chatbot.tsx',
];
for (const relative of files) {
  const file = path.join('client/src', relative), text = fs.readFileSync(file, 'utf8');
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const edits = [], components = new Set();
  function replace(node, key, wrap) {
    edits.push({ start: node.getStart(source), end: node.end, text: wrap ? `{t(${JSON.stringify(key)})}` : `t(${JSON.stringify(key)})` });
    let ancestor = node;
    while (ancestor) {
      const name = ts.isFunctionDeclaration(ancestor) ? ancestor.name?.text : ts.isArrowFunction(ancestor) && ts.isVariableDeclaration(ancestor.parent) ? ancestor.parent.name.getText(source) : '';
      if (/^[A-Z]/.test(name || '') && ancestor.body && ts.isBlock(ancestor.body)) { components.add(ancestor); break; }
      ancestor = ancestor.parent;
    }
  }
  function scan(node) {
    if (ts.isJsxText(node)) {
      const normalized = node.text.replace(/\s+/g, ' ').trim();
      if (replacements.has(normalized)) {
        const leading = node.text.match(/^\s*/)[0], trailing = node.text.match(/\s*$/)[0];
        edits.push({ start: node.pos, end: node.end, text: `${leading}{t(${JSON.stringify(replacements.get(normalized))})}${trailing}` });
        let ancestor = node;
        while (ancestor) {
          const name = ts.isFunctionDeclaration(ancestor) ? ancestor.name?.text : ts.isArrowFunction(ancestor) && ts.isVariableDeclaration(ancestor.parent) ? ancestor.parent.name.getText(source) : '';
          if (/^[A-Z]/.test(name || '') && ancestor.body && ts.isBlock(ancestor.body)) { components.add(ancestor); break; }
          ancestor = ancestor.parent;
        }
      }
    }
    if (ts.isJsxAttribute(node) && ['title', 'placeholder', 'aria-label', 'alt'].includes(node.name.text) && node.initializer && ts.isStringLiteral(node.initializer) && replacements.has(node.initializer.text)) replace(node.initializer, replacements.get(node.initializer.text), true);
    if (ts.isJsxExpression(node)) {
      function expressions(child) {
        if (ts.isJsxElement(child) || ts.isJsxSelfClosingElement(child) || ts.isJsxFragment(child)) return;
        if ((ts.isStringLiteral(child) || ts.isNoSubstitutionTemplateLiteral(child)) && replacements.has(child.text) && !ts.isCallExpression(child.parent) && !['True', 'False'].includes(child.text)) replace(child, replacements.get(child.text), false);
        ts.forEachChild(child, expressions);
      }
      expressions(node);
    }
    ts.forEachChild(node, scan);
  }
  scan(source);
  for (const component of components) if (!component.body.getText(source).includes('useLanguage()')) edits.push({ start: component.body.getStart(source) + 1, end: component.body.getStart(source) + 1, text: '\n  const { t } = useLanguage();' });
  if (edits.length && !text.includes('import { useLanguage }')) edits.push({ start: 0, end: 0, text: 'import { useLanguage } from "@/lib/language-context";\n' });
  fs.writeFileSync(file, apply(text, edits));
  console.log(file, edits.length);
}
