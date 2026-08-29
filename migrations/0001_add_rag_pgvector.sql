CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE "rag_sources" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" varchar NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "content_hash" varchar(64) NOT NULL,
  "embedding_model" text NOT NULL,
  "embedding_dimensions" integer DEFAULT 1536 NOT NULL,
  "chunk_count" integer NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX "rag_sources_user_idx" ON "rag_sources" ("user_id");
CREATE INDEX "rag_sources_content_hash_idx" ON "rag_sources" ("content_hash");

CREATE TABLE "rag_source_chunks" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "source_id" varchar NOT NULL REFERENCES "rag_sources"("id") ON DELETE CASCADE,
  "chunk_index" integer NOT NULL,
  "content" text NOT NULL,
  "start_offset" integer NOT NULL,
  "end_offset" integer NOT NULL,
  "section_label" text,
  "embedding" vector(1536) NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX "rag_source_chunks_source_position_idx"
  ON "rag_source_chunks" ("source_id", "chunk_index");
CREATE INDEX "rag_source_chunks_source_idx" ON "rag_source_chunks" ("source_id");
CREATE INDEX "rag_source_chunks_embedding_hnsw_idx"
  ON "rag_source_chunks" USING hnsw ("embedding" vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

ALTER TABLE "quizzes"
  ADD COLUMN "rag_source_id" varchar REFERENCES "rag_sources"("id") ON DELETE SET NULL;
CREATE UNIQUE INDEX "quizzes_rag_source_idx" ON "quizzes" ("rag_source_id");
