const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');
const file = 'client/src/lib/language-context.tsx';
let text = fs.readFileSync(file, 'utf8');
const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const sections = {
  navigationGuard: {
    leaveCreate: ['Leave Create page?', 'Rời trang tạo bài quiz?'], discardReview: ['Discard Review Session?', 'Hủy phiên ôn tập?'], leaveQuiz: ['Leave Quiz?', 'Rời bài quiz?'], saveRevision: ['Save Revision Progress?', 'Lưu tiến độ ôn tập?'],
    leaveCreateDescription: ['Leaving this page will remove every added material, uploaded file, pasted note, video transcript, and prompt.', 'Rời trang này sẽ xóa toàn bộ tài liệu đã thêm, tệp tải lên, ghi chú đã dán, bản chép lời video và yêu cầu tạo bài quiz.'], discardReviewDescription: ['Your review session progress will not be saved. Are you sure you want to exit?', 'Tiến độ của phiên ôn tập này sẽ không được lưu. Bạn có chắc muốn thoát?'], unsavedQuizDescription: ['This quiz does not save progress. Are you sure you want to leave?', 'Bài quiz này không lưu tiến độ. Bạn có chắc muốn rời đi?'], saveRevisionDescription: ["You're currently revising incorrect answers. Your revision progress will be saved so you can continue later.", 'Bạn đang ôn lại các câu trả lời sai. Tiến độ ôn tập sẽ được lưu để bạn có thể tiếp tục sau.'], saveQuizDescription: ['You have a quiz in progress. Would you like to save your progress for later?', 'Bạn đang làm một bài quiz. Bạn có muốn lưu tiến độ để tiếp tục sau?'], stayOnCreate: ['Stay on Create', 'Ở lại trang tạo bài quiz'], continueQuiz: ['Continue Quiz', 'Tiếp tục làm bài'], discardAndLeave: ['Discard & Leave', 'Hủy và rời đi'], discardAndExit: ['Discard & Exit', 'Hủy và thoát'], saveAndExit: ['Save & Exit', 'Lưu và thoát'],
  },
  auth: {
    welcomeBack: ['Welcome back! Sign in to continue', 'Chào mừng trở lại! Đăng nhập để tiếp tục'], createAccountDescription: ['Create an account to get started', 'Tạo tài khoản để bắt đầu'], emailAddress: ['Email address', 'Địa chỉ email'], password: ['Password', 'Mật khẩu'], passwordMinimum: ['Password (min 8 characters)', 'Mật khẩu (ít nhất 8 ký tự)'], forgotPassword: ['Forgot password?', 'Quên mật khẩu?'], signIn: ['Sign In', 'Đăng nhập'], signingIn: ['Signing in...', 'Đang đăng nhập...'], continueGoogle: ['Continue with Google', 'Tiếp tục với Google'], noAccount: ["Don't have an account?", 'Chưa có tài khoản?'], agreement: ['By continuing, you agree to our', 'Bằng việc tiếp tục, bạn đồng ý với'], createAccount: ['Create Account', 'Tạo tài khoản'], signingUp: ['Signing up...', 'Đang đăng ký...'], signUpGoogle: ['Sign up with Google', 'Đăng ký với Google'], haveAccount: ['Already have an account?', 'Đã có tài khoản?'], changeEmail: ['Change email address', 'Đổi địa chỉ email'], emailVerified: ['Email verified!', 'Đã xác minh email!'], ready: ["You're all set to start.", 'Bạn đã sẵn sàng để bắt đầu.'], verificationFailed: ['Verification failed', 'Xác minh thất bại'], sendCodeFailed: ['Failed to send code', 'Không thể gửi mã'], resentDescription: ['A new verification code has been sent to {email}', 'Mã xác minh mới đã được gửi đến {email}'],
  },
  accuracyDialog: {
    averageAccuracy: ['Avg. Accuracy', 'Độ chính xác trung bình'], quizzesTaken: ['Quizzes Taken', 'Bài quiz đã làm'], recentTrend: ['Recent Trend', 'Xu hướng gần đây'], accuracyOverTime: ['Accuracy Over Time', 'Độ chính xác theo thời gian'], recentResults: ['Recent Results', 'Kết quả gần đây'], noResults: ['Take some quizzes to see your progress!', 'Làm bài quiz để theo dõi tiến độ của bạn!'], outstanding: ['Outstanding!', 'Xuất sắc!'], greatProgress: ['Great Progress!', 'Tiến bộ tốt!'], keepGoing: ['Keep Going!', 'Tiếp tục cố gắng!'], everyStep: ['Every Step Counts!', 'Mỗi bước đều có ý nghĩa!'], consistent: ["You're on the right track. Consistency is the key to success!", 'Bạn đang đi đúng hướng. Kiên trì là chìa khóa để thành công!'],
  },
};
const replacements = new Map();
for (const [section, values] of Object.entries(sections)) for (const [key, pair] of Object.entries(values)) replacements.set(pair[0], `${section}.${key}`);
const edits = [];
function visit(node) {
  if (ts.isVariableDeclaration(node) && node.name.getText(source) === 'dictionaries') {
    const dictionaries = vm.runInNewContext('(' + node.initializer.getText(source) + ')');
    function existing(object, prefix = '') {
      for (const [key, value] of Object.entries(object)) {
        const full = prefix ? `${prefix}.${key}` : key;
        if (typeof value === 'string' && !replacements.has(value)) replacements.set(value, full);
        else if (value && typeof value === 'object' && !Array.isArray(value)) existing(value, full);
      }
    }
    existing(dictionaries.en);
    for (const langNode of node.initializer.properties) {
      const lang = langNode.name.getText(source);
      for (const [section, values] of Object.entries(sections)) {
        const sectionNode = langNode.initializer.properties.find(p => p.name.getText(source) === section);
        const addition = Object.entries(values).map(([key, pair]) => `\n      ${key}: ${JSON.stringify(pair[lang === 'en' ? 0 : 1])},`).join('');
        edits.push({ start: (sectionNode?.initializer || langNode.initializer).getStart(source) + 1, end: (sectionNode?.initializer || langNode.initializer).getStart(source) + 1, text: sectionNode ? addition : `\n    ${section}: {${addition}\n    },` });
      }
    }
  }
  ts.forEachChild(node, visit);
}
visit(source);
function apply(text, edits) { for (const edit of edits.sort((a,b) => b.start - a.start)) text = text.slice(0, edit.start) + edit.text + text.slice(edit.end); return text; }
fs.writeFileSync(file, apply(text, edits));
for (const file of ['client/src/components/auth-dialog.tsx', 'client/src/components/accuracy-dialog.tsx']) {
  const text = fs.readFileSync(file, 'utf8'), source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const edits = [];
  function visit(node) {
    if (ts.isJsxText(node)) {
      const normalized = node.text.replace(/\s+/g, ' ').trim();
      if (replacements.has(normalized)) edits.push({ start: node.pos, end: node.end, text: node.text.match(/^\s*/)[0] + `{t(${JSON.stringify(replacements.get(normalized))})}` + node.text.match(/\s*$/)[0] });
    }
    if (ts.isJsxAttribute(node) && ['title', 'placeholder', 'aria-label'].includes(node.name.text) && node.initializer && ts.isStringLiteral(node.initializer) && replacements.has(node.initializer.text)) edits.push({ start: node.initializer.getStart(source), end: node.initializer.end, text: `{t(${JSON.stringify(replacements.get(node.initializer.text))})}` });
    if (ts.isJsxExpression(node)) {
      function expr(child) {
        if (ts.isJsxElement(child) || ts.isJsxSelfClosingElement(child) || ts.isJsxFragment(child)) return;
        if (ts.isStringLiteral(child) && replacements.has(child.text) && !ts.isCallExpression(child.parent)) edits.push({ start: child.getStart(source), end: child.end, text: `t(${JSON.stringify(replacements.get(child.text))})` });
        ts.forEachChild(child, expr);
      }
      expr(node);
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  if (file.includes('accuracy-dialog')) {
    edits.push({ start: 0, end: 0, text: 'import { useLanguage } from "@/lib/language-context";\n' });
    text.indexOf('export function AccuracyDialog');
    const component = source.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === 'AccuracyDialog');
    edits.push({ start: component.body.getStart(source) + 1, end: component.body.getStart(source) + 1, text: '\n  const { t } = useLanguage();' });
  }
  fs.writeFileSync(file, apply(text, edits));
}
