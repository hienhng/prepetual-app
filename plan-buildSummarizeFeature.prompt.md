## Plan: Build Summarize Feature

TL;DR: The repository already has a backend summarization endpoint in `server/routes.ts`. The main work is integrating a front-end UI and calling `POST /api/summarize-text` with the input text.

**Steps**
1. Review the existing back-end summarize route in `server/routes.ts` at `/api/summarize-text`.
   - It accepts `{ text }` and uses `openaiClient.chat.completions.create` to generate a bullet-point summary.
   - It already validates text length and returns `{ summary }`.
2. Choose where to expose the feature in the UI.
   - Option A: add a new page component under `client/src/pages/`.
   - Option B: add a summary panel/button inside an existing page such as `client/src/pages/create.tsx` or `client/src/components/quiz-generator.tsx`.
3. Create a front-end input form or textarea for the source content.
   - Include a submit button and a summary display area.
   - Add user feedback for loading and errors.
4. Use the shared request helper in `client/src/lib/queryClient.ts`.
   - Call `apiRequest("POST", "/api/summarize-text", { text })`.
   - Parse the JSON response and display `summary`.
5. Add front-end validation.
   - Require a minimum number of characters before calling the API.
   - Show an error if the server returns a 400/500 response.
6. Optionally improve the server prompt or add a dedicated helper.
   - If desired, move the prompt into `server/openai.ts` as `summarizeText` and call it from `server/routes.ts`.
   - Keep the summary instructions consistent with the product’s study-assistant tone.
7. Test the feature.
   - Manually verify the form submits text and shows the returned summary.
   - Test short text validation and error handling.
   - Confirm the summary is returned in the same language as input.

**Relevant files**
- `server/routes.ts` — existing `/api/summarize-text` endpoint and AI prompt.
- `client/src/lib/queryClient.ts` — `apiRequest` helper used for POST requests.
- `client/src/pages/create.tsx` or `client/src/components/quiz-generator.tsx` — best candidate locations for UI integration.

**Verification**
1. Manually enter sample content in the new summary UI and confirm a bullet-point summary appears.
2. Confirm the request is sent to `/api/summarize-text` via browser devtools.
3. Validate error messages for empty or too-short content.
4. If adding tests, verify any new component renders and calls the endpoint correctly.

**Decisions**
- Use the existing backend route instead of creating a new route from scratch.
- Keep the summarization flow focused on plain text input for initial implementation.
