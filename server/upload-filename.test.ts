import assert from "node:assert/strict";
import { once } from "node:events";
import type { AddressInfo } from "node:net";
import test from "node:test";
import express from "express";
import multer from "multer";
import { decodeUploadedFileName } from "../shared/upload-filename.js";

const vietnameseName = "KSCL CHƯƠNG 1 VÀ 2 LẦN 3. docx.pdf";

test("repairs the reported Vietnamese filename", () => {
  assert.equal(
    decodeUploadedFileName("KSCL CHÆ¯Æ\u00a0NG 1 VÃ\u0080 2 Láº¦N 3. docx.pdf"),
    vietnameseName,
  );
});

test("repairs UTF-8 filenames decoded as Latin-1 or Windows-1252", () => {
  for (const name of [vietnameseName, "日本語.pdf", "Урок.docx", "Résumé € 📚.pdf"]) {
    const bytes = Buffer.from(name, "utf8");
    assert.equal(decodeUploadedFileName(bytes.toString("latin1")), name);
    assert.equal(decodeUploadedFileName(new TextDecoder("windows-1252").decode(bytes)), name);
  }
});

test("preserves correctly decoded international names and filename punctuation", () => {
  for (const name of [vietnameseName, "日本語.pdf", "Урок.docx", "Résumé € 📚.pdf",
    "résumé.pdf", "Ångström.docx", "100% + notes (final).pdf", "", "\uFEFFnotes.pdf"]) {
    assert.equal(decodeUploadedFileName(name), name);
  }
});

test("leaves invalid UTF-8 byte sequences unchanged", () => {
  for (const name of ["notes Ã.pdf", "notes \u00ff.pdf", "notes �.pdf"]) {
    assert.equal(decodeUploadedFileName(name), name);
  }
});

test("returns Unicode names from real multipart uploads, including filename*", async (t) => {
  const app = express();
  const upload = multer({ storage: multer.memoryStorage() });
  app.post("/upload", upload.array("files", 10), (req, res) => {
    const files = req.files as Express.Multer.File[];
    res.json(files.map(file => ({
      fileName: decodeUploadedFileName(file.originalname),
      contents: file.buffer.toString("utf8"),
    })));
  });
  const server = app.listen(0, "127.0.0.1");
  t.after(() => server.close());
  await once(server, "listening");
  const { port } = server.address() as AddressInfo;

  for (const extended of [false, true]) {
    const boundary = "filename-encoding-test";
    const header = extended
      ? `filename*=UTF-8''${encodeURIComponent(vietnameseName)}`
      : `filename="${vietnameseName}"`;
    const response = await fetch(`http://127.0.0.1:${port}/upload`, {
      method: "POST",
      headers: { "Content-Type": `multipart/form-data; boundary=${boundary}`, Connection: "close" },
      body: Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="files"; ${header}\r\n`
        + `Content-Type: application/pdf\r\n\r\nfile contents\r\n--${boundary}--\r\n`,
        "utf8",
      ),
    });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), [{ fileName: vietnameseName, contents: "file contents" }]);
  }
});
