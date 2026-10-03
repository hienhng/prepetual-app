const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');
const file = 'client/src/lib/language-context.tsx';
let text = fs.readFileSync(file, 'utf8');
const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const extra = {
  common: { expand: ['Expand', 'Mở rộng'] },
  quizGenerator: { combinedCharactersReady: ['{count} material characters plus your quiz prompt ready for generation', '{count} ký tự tài liệu cùng yêu cầu của bạn đã sẵn sàng để tạo bài quiz'] },
  create: { promptSettingsError: ['Could not read prompt settings. Set the count and difficulty manually, or retry.', 'Không thể đọc tùy chọn từ yêu cầu. Hãy tự chọn số câu hỏi và độ khó hoặc thử lại.'] },
  materialPane: { noMaterial: ['No study material is available to summarize.', 'Không có tài liệu học tập để tóm tắt.'] },
  quizGeneration: {
    readingPrompt: ['Reading your quiz prompt...', 'Đang đọc yêu cầu tạo bài quiz...'], planning: ['Planning your requested quiz...', 'Đang lên kế hoạch cho bài quiz...'], language: ['Determining quiz language...', 'Đang xác định ngôn ngữ bài quiz...'], creatingMaterial: ['Creating study material for your quiz...', 'Đang tạo tài liệu học tập cho bài quiz...'], materialReady: ['Study material created. Generating questions from it...', 'Đã tạo tài liệu học tập. Đang tạo câu hỏi từ tài liệu...'], classifying: ['Analyzing image content types...', 'Đang phân tích nội dung hình ảnh...'], visuals: ['Processing visual content...', 'Đang xử lý nội dung hình ảnh...'], verifying: ['Solving and independently auditing answers...', 'Đang giải và kiểm tra độc lập các đáp án...'], extracting: ['Reading text from images...', 'Đang đọc văn bản từ hình ảnh...'], ocrFallback: ['AI reading unavailable. Using basic OCR...', 'AI tạm thời không thể đọc. Đang dùng nhận dạng văn bản cơ bản...'], importingQuestions: ['AI is selecting multiple-choice questions and finding answers...', 'AI đang chọn câu hỏi trắc nghiệm và tìm đáp án...'], checkpoint: ['{generated} of {requested} validated questions saved.', 'Đã lưu {generated}/{requested} câu hỏi được kiểm tra.'], remainingProgress: ['Generating {count} remaining questions...', 'Đang tạo {count} câu hỏi còn lại...'], importedCount: ['Imported {count} questions!', 'Đã nhập {count} câu hỏi!'],
  },
  fileUpload: {
    queued: ['Queued for processing...', 'Đang chờ xử lý...'], analyzing: ['Starting document analysis...', 'Đang bắt đầu phân tích tài liệu...'], extractingPdf: ['Extracting text from PDF...', 'Đang trích xuất văn bản từ PDF...'], extractingDocument: ['Extracting text from document...', 'Đang trích xuất văn bản từ tài liệu...'], preparingImage: ['Preparing image for quiz generation...', 'Đang chuẩn bị hình ảnh để tạo bài quiz...'], scanningImages: ['Scanning for images and graphics...', 'Đang tìm hình ảnh và đồ họa...'], embeddedImages: ['Preparing embedded images for quiz generation...', 'Đang chuẩn bị hình ảnh trong tài liệu để tạo bài quiz...'], finalizing: ['Finalizing...', 'Đang hoàn tất...'], documentReady: ['Document ready for visual analysis!', 'Tài liệu đã sẵn sàng để phân tích hình ảnh!'], imageReady: ['Image ready for visual analysis!', 'Hình ảnh đã sẵn sàng để phân tích!'], complete: ['Extraction complete!', 'Đã trích xuất xong!'], extractionFailed: ['Extraction failed', 'Trích xuất thất bại'], pdfPageProgress: ['Extracting text from PDF (page {current} of {total})...', 'Đang trích xuất văn bản từ PDF (trang {current}/{total})...'],
  },
};
const dialog = fs.readFileSync('client/src/components/quiz-generation-dialog.tsx', 'utf8');
const tips = vm.runInNewContext(dialog.match(/const STUDY_TIPS = (\[[\s\S]*?\]);/)[1]);
extra.quizGeneration.studyTips = [tips, [
  'Chia thời gian học thành các phiên 25 phút và nghỉ ngắn giữa các phiên.',
  'Dạy lại điều đã học cho người khác là một trong những cách tốt nhất để ghi nhớ.',
  'Ngủ đủ giấc! Não củng cố trí nhớ trong lúc bạn nghỉ ngơi.',
  'Chủ động nhớ lại kiến thức thay vì chỉ đọc lại ghi chú. Hãy thường xuyên tự kiểm tra!',
  'Liên hệ kiến thức mới với những điều đã biết để ghi nhớ tốt hơn.',
  'Học ở nhiều địa điểm giúp não hình thành thêm các liên hệ.',
  'Viết tay ghi chú có thể giúp ghi nhớ tốt hơn so với gõ máy.',
  'Uống đủ nước! Thiếu nước nhẹ cũng có thể ảnh hưởng đến khả năng tư duy.',
  'Ôn lại kiến thức trước khi ngủ để củng cố trí nhớ tốt hơn.',
  'Dùng mẹo ghi nhớ và cung điện ký ức để học các danh sách và trình tự.',
  'Tập thể dục thường xuyên giúp tăng lưu lượng máu lên não và cải thiện sự tập trung.',
  'Loại bỏ những thứ gây xao nhãng khi học. Hãy để điện thoại ở phòng khác!',
  'Dùng phương pháp Feynman: giải thích khái niệm đơn giản như đang dạy một em nhỏ.',
  'Chia đều việc học theo thời gian thay vì học dồn một lần.',
  'Tự kiểm tra ngay cả khi bạn chưa thấy sẵn sàng để tăng khả năng nhớ lại kiến thức.',
]];
const edits = [];
function visit(node) {
  if (ts.isVariableDeclaration(node) && node.name.getText(source) === 'dictionaries') {
    for (const langNode of node.initializer.properties) {
      const lang = langNode.name.getText(source);
      for (const [section, values] of Object.entries(extra)) {
        const sectionNode = langNode.initializer.properties.find(p => p.name.getText(source) === section);
        const addition = Object.entries(values).map(([key, pair]) => `\n      ${key}: ${JSON.stringify(pair[lang === 'en' ? 0 : 1])},`).join('');
        edits.push({ position: sectionNode.initializer.getStart(source) + 1, text: addition });
      }
    }
  }
  ts.forEachChild(node, visit);
}
visit(source);
for (const edit of edits.sort((a,b) => b.position-a.position)) text = text.slice(0, edit.position) + edit.text + text.slice(edit.position);
text = text.replace('aiReviseDesc: "Mô tả cách bạn muốn AI chỉnh sửa câu hỏi."', 'aiReviseDesc: "AI có thể mắc lỗi. Đáp án nào mới thực sự đúng?"');
text = text.replace('noQuizzesInProgress: "Chưa có bài quiz nào đang làm"', 'noQuizzesInProgress: "Bạn chưa có bài quiz nào đang làm. Hãy bắt đầu làm bài và lưu tiến độ để tiếp tục từ nơi bạn dừng lại."');
fs.writeFileSync(file, text);
