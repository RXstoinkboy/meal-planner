-- CreateEnum
CREATE TYPE "recipe_source_type" AS ENUM ('manual', 'link', 'image', 'pdf', 'suggestion');

-- CreateEnum
CREATE TYPE "recipe_source_kind" AS ENUM ('link', 'video', 'book');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "full_name" VARCHAR(255),
    "email" VARCHAR(254) NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipes" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "servings" INTEGER NOT NULL,
    "prep_minutes" INTEGER,
    "cook_minutes" INTEGER,
    "cuisine" VARCHAR(255),
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "tools" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notes" TEXT,
    "source_type" "recipe_source_type" NOT NULL DEFAULT 'manual',
    "source_url" VARCHAR(255),
    "source_raw_path" VARCHAR(255),
    "source_fetched_at" TIMESTAMP(6),
    "extraction_model" VARCHAR(255),
    "extraction_confidence" JSONB,
    "source_stale" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,
    "deleted_at" TIMESTAMP(6),

    CONSTRAINT "recipes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipe_ingredients" (
    "id" SERIAL NOT NULL,
    "recipe_id" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "raw_text" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "quantity" DECIMAL(8,2),
    "unit" VARCHAR(255),
    "category" VARCHAR(255),
    "optional" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "recipe_ingredients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipe_steps" (
    "id" SERIAL NOT NULL,
    "recipe_id" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "duration_minutes" INTEGER,

    CONSTRAINT "recipe_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipe_sources" (
    "id" SERIAL NOT NULL,
    "recipe_id" INTEGER NOT NULL,
    "url" VARCHAR(255) NOT NULL,
    "kind" "recipe_source_kind" NOT NULL,
    "label" VARCHAR(255),
    "added_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recipe_sources_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "recipes_user_id_idx" ON "recipes"("user_id");

-- CreateIndex
CREATE INDEX "recipes_tags_gin" ON "recipes" USING GIN ("tags");

-- CreateIndex
CREATE INDEX "recipe_ingredients_recipe_id_idx" ON "recipe_ingredients"("recipe_id");

-- CreateIndex
CREATE INDEX "recipe_steps_recipe_id_idx" ON "recipe_steps"("recipe_id");

-- CreateIndex
CREATE INDEX "recipe_sources_recipe_id_idx" ON "recipe_sources"("recipe_id");

-- AddForeignKey
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_ingredients" ADD CONSTRAINT "recipe_ingredients_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_steps" ADD CONSTRAINT "recipe_steps_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_sources" ADD CONSTRAINT "recipe_sources_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
