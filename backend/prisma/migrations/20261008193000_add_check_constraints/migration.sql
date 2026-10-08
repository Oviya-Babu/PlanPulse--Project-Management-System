-- Add CHECK constraints per PRD §16

-- 1. Full name trimmed length >= 1
ALTER TABLE "users" ADD CONSTRAINT "users_full_name_check" CHECK (length(trim("full_name")) >= 1);

-- 2. Project name trimmed length >= 1
ALTER TABLE "projects" ADD CONSTRAINT "projects_name_check" CHECK (length(trim("name")) >= 1);

-- 3. Project end date >= start date if both set
ALTER TABLE "projects" ADD CONSTRAINT "projects_dates_check" CHECK ("end_date" IS NULL OR "start_date" IS NULL OR "end_date" >= "start_date");

-- 4. Task name trimmed length >= 1
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_name_check" CHECK (length(trim("name")) >= 1);
