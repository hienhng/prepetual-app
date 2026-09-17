const { chromium } = require('C:/Users/Gia Hien/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs = require('node:fs');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  try {
    const page = await browser.newPage();
    await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, route => route.abort());
    page.on('pageerror', error => console.log('PAGE ERROR', error.message));
    console.log('Browser ready');
    await page.route('**/api/**', route => route.fulfill({ json: route.request().url().endsWith('/api/auth/user') ? { id: 'qa', email: 'qa@example.com', onboardingCompleted: true } : [] }));
    await page.goto('http://127.0.0.1:5173/');
    console.log('App loaded');
    const result = await page.evaluate(async () => {
      const { createQuizPdf } = await import('/src/lib/quiz-pdf.tsx');
      const image = document.createElement('canvas');
      image.width = 480; image.height = 160;
      const ctx = image.getContext('2d');
      ctx.fillStyle = '#f1f5f9'; ctx.fillRect(0, 0, 480, 160);
      ctx.strokeStyle = '#334155'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(50, 120); ctx.lineTo(50, 30); ctx.lineTo(400, 120); ctx.closePath(); ctx.stroke();
      ctx.fillStyle = '#172033'; ctx.font = '20px Arial'; ctx.fillText('3 cm', 65, 70); ctx.fillText('4 cm', 230, 146);
      const questions = [
        { id: '1', type: 'multiple_choice', question: '**Tính nghiệm** của phương trình $x^2 - 5x + 6 = 0$.\nChoose the correct pair of roots.', options: ['A) $x=2, 3$', 'B) $x=-2, -3$', 'C) $x=1, 6$', 'D) No real roots'], correctAnswer: 'A' },
        { id: '2', type: 'short_answer', question: 'Evaluate the integral. Show your work.\n\n$$\n\\int_0^1 x^2\\,dx = \\left[\\frac{x^3}{3}\\right]_0^1\n$$', correctAnswer: '1/3' },
        { id: '3', type: 'true_false', question: 'A right triangle satisfies \\(a^2+b^2=c^2\\).', imageUrl: image.toDataURL(), correctAnswer: 'True' },
        { id: '4', type: 'multiple_choice', question: 'Read the **table** and choose the *largest* value.\n\n| Item | Value |\n| --- | --- |\n| Alpha | 12 |\n| Beta | 24 |\n\nUse `max(values)` to check.', options: ['Alpha', 'Beta'], correctAnswer: 'Beta' },
        ...Array.from({ length: 12 }, (_, i) => ({ id: `q${i}`, type: 'multiple_choice', question: `Practice ${i + 1}: Find the value of $\\frac{${i + 2}}{2}$ and explain the relationship between the numerator and denominator.`, options: ['First possible answer', 'Second possible answer with **emphasis**', 'Third possible answer', 'Fourth possible answer'], correctAnswer: 'First possible answer' })),
        { id: 'long', type: 'short_answer', question: 'Read the following long passage.\n\n' + Array.from({ length: 85 }, (_, i) => `Line ${i + 1}: A long question should continue cleanly on the next page without cutting its text.`).join('\n') + '\n\n**END OF LONG QUESTION**', correctAnswer: 'Done' },
      ];
      const input = { title: 'Ôn tập Vật lý & Mathematics', category: 'Science', questions };
      const doc = await createQuizPdf(input);
      const count = doc.getNumberOfPages();
      const bytes = doc.output('arraybuffer').byteLength;
      const pdf = doc.output('datauristring').split(',')[1];
      document.documentElement.classList.add('dark');
      const dark = await createQuizPdf({ ...input, questions: questions.slice(0, 4) });
      let failure = '';
      try { await createQuizPdf({ ...input, questions: [{ ...questions[0], imageUrl: 'data:image/png;base64,broken' }] }); } catch (error) { failure = error.message; }
      return { count, bytes, pdf, dark: dark.output('datauristring').split(',')[1], failure, leftovers: document.querySelectorAll('.quiz-pdf').length, input };
    });
    fs.writeFileSync('tmp/pdfs/quiz.pdf', Buffer.from(result.pdf, 'base64'));
    fs.writeFileSync('tmp/pdfs/dark.pdf', Buffer.from(result.dark, 'base64'));
    assert.equal(result.leftovers, 0);
    assert.match(result.failure, /image/);
    assert.ok(result.count > 3);
    assert.ok(result.bytes < 2000000, `PDF too large: ${result.bytes}`);
    console.log(JSON.stringify({ pages: result.count, bytes: result.bytes, cleanup: true, brokenImageError: result.failure }));
    await page.evaluate(input => sessionStorage.setItem('quiz_progress', JSON.stringify({ quiz: { ...input, id: 'qa-quiz', userId: 'qa' }, answers: {}, checkedQuestions: [] })), result.input);
    await page.goto('http://127.0.0.1:5173/edit-quiz');
    const button = page.getByTestId('button-export-pdf');
    await button.waitFor({ timeout: 30000 });
    const download = page.waitForEvent('download');
    await button.click();
    const file = await download;
    await file.saveAs('tmp/pdfs/download.pdf');
    assert.equal(file.suggestedFilename(), 'Ôn_tập_Vật_lý_Mathematics.pdf');
    await page.getByText('Your quiz has been successfully exported to PDF.').waitFor();
    assert.equal(await button.isEnabled(), true);
    console.log('PASS actual edit-page download, filename, success message, and re-enabled button');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
