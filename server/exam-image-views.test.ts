import assert from "node:assert/strict";
import test from "node:test";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { examImageReadingViews } from "./exam-image-views.js";

test("dense portrait pages retain full context and overlapping top/bottom detail views", async () => {
  const canvas = createCanvas(1_000, 2_000);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "red"; ctx.fillRect(0, 0, 1_000, 1_000);
  ctx.fillStyle = "blue"; ctx.fillRect(0, 1_000, 1_000, 1_000);
  const original = `data:image/png;base64,${canvas.toBuffer("image/png").toString("base64")}`;
  const views = await examImageReadingViews(original);
  assert.equal(views.length, 3);
  assert.equal(views[0], original);
  for (const [index, view] of views.slice(1).entries()) {
    const image = await loadImage(Buffer.from(view.split(",")[1], "base64"));
    assert.equal(image.width, 1_000);
    assert.equal(image.height, 1_120);
    const crop = createCanvas(image.width, image.height);
    const context = crop.getContext("2d");
    context.drawImage(image, 0, 0);
    const top = context.getImageData(10, 10, 1, 1).data;
    const bottom = context.getImageData(10, image.height - 10, 1, 1).data;
    assert.ok(top[0] > 240 && top[2] < 10, `view ${index + 1} includes upper red content`);
    assert.ok(bottom[2] > 240 && bottom[0] < 10, `view ${index + 1} includes lower blue content`);
  }
});

test("small pages and remote image references remain unchanged", async () => {
  const canvas = createCanvas(400, 500);
  const original = `data:image/png;base64,${canvas.toBuffer("image/png").toString("base64")}`;
  assert.deepEqual(await examImageReadingViews(original), [original]);
  assert.deepEqual(await examImageReadingViews("https://example.invalid/exam.jpg"), ["https://example.invalid/exam.jpg"]);
});
