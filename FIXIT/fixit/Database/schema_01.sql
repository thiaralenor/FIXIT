-- ============================================================
-- FIXIT DATABASE
-- Supabase / PostgreSQL
-- ============================================================


-- ============================================================
-- 1. EXTENSIONS
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;


-- ============================================================
-- 2. ENUM TYPES
-- ============================================================

CREATE TYPE user_role AS ENUM (
    'community',
    'organization'
);

CREATE TYPE problem_priority AS ENUM (
    'low',
    'medium',
    'high'
);

CREATE TYPE problem_status AS ENUM (
    'reported',
    'solved'
);

CREATE TYPE task_status AS ENUM (
    'added_to_task',
    'in_progress',
    'solved'
);


-- ============================================================
-- 3. PROFILES
-- One profile for every FixIt user
-- ============================================================

CREATE TABLE profiles (
    id UUID PRIMARY KEY
        REFERENCES auth.users(id)
        ON DELETE CASCADE,

    full_name TEXT NOT NULL,

    email TEXT,

    phone TEXT,

    avatar_url TEXT,

    role user_role NOT NULL DEFAULT 'community',

    location TEXT,

    latitude DOUBLE PRECISION,

    longitude DOUBLE PRECISION,

    organization_id UUID,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 4. ORGANIZATIONS
-- The organization represented by an organization account
-- ============================================================

CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name TEXT NOT NULL,

    description TEXT,

    organization_type TEXT,

    email TEXT,

    phone TEXT,

    logo_url TEXT,

    location TEXT,

    latitude DOUBLE PRECISION,

    longitude DOUBLE PRECISION,

    verified BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- Add the relationship after organizations exists

ALTER TABLE profiles
ADD CONSTRAINT profiles_organization_id_fkey
FOREIGN KEY (organization_id)
REFERENCES organizations(id)
ON DELETE SET NULL;


-- ============================================================
-- 5. PROBLEM CATEGORIES
-- ============================================================

CREATE TABLE problem_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name TEXT UNIQUE NOT NULL,

    description TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 6. CHANNELS
--
-- Called "Communities" in the FixIt UI.
-- Users follow these channels to receive updates.
-- ============================================================

CREATE TABLE channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name TEXT NOT NULL,

    description TEXT,

    category_id UUID
        REFERENCES problem_categories(id)
        ON DELETE SET NULL,

    image_url TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 7. CHANNEL FOLLOWERS
-- Both Community and Organization users can follow channels
-- ============================================================

CREATE TABLE channel_followers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    channel_id UUID NOT NULL
        REFERENCES channels(id)
        ON DELETE CASCADE,

    user_id UUID NOT NULL
        REFERENCES profiles(id)
        ON DELETE CASCADE,

    followed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(channel_id, user_id)
);


-- ============================================================
-- 8. PROBLEMS
-- Main social/problem posts in FixIt
-- ============================================================

CREATE TABLE problems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    reported_by UUID NOT NULL
        REFERENCES profiles(id)
        ON DELETE CASCADE,

    channel_id UUID
        REFERENCES channels(id)
        ON DELETE SET NULL,

    category_id UUID
        REFERENCES problem_categories(id)
        ON DELETE SET NULL,

    title TEXT NOT NULL,

    description TEXT NOT NULL,

    priority problem_priority NOT NULL DEFAULT 'medium',

    status problem_status NOT NULL DEFAULT 'reported',

    location TEXT,

    latitude DOUBLE PRECISION,

    longitude DOUBLE PRECISION,

    people_affected INTEGER NOT NULL DEFAULT 1
        CHECK (people_affected >= 1),

    is_public BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 9. PROBLEM IMAGES
-- Actual image files will be stored in Supabase Storage.
-- This table stores their references.
-- ============================================================

CREATE TABLE problem_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    problem_id UUID NOT NULL
        REFERENCES problems(id)
        ON DELETE CASCADE,

    storage_path TEXT NOT NULL,

    uploaded_by UUID
        REFERENCES profiles(id)
        ON DELETE SET NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 10. LIKES
-- Both user types can like problems
-- ============================================================

CREATE TABLE problem_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    problem_id UUID NOT NULL
        REFERENCES problems(id)
        ON DELETE CASCADE,

    user_id UUID NOT NULL
        REFERENCES profiles(id)
        ON DELETE CASCADE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(problem_id, user_id)
);


-- ============================================================
-- 11. COMMENTS
-- ============================================================

CREATE TABLE problem_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    problem_id UUID NOT NULL
        REFERENCES problems(id)
        ON DELETE CASCADE,

    user_id UUID NOT NULL
        REFERENCES profiles(id)
        ON DELETE CASCADE,

    comment TEXT NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 12. REPOSTS
-- ============================================================

CREATE TABLE problem_reposts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    problem_id UUID NOT NULL
        REFERENCES problems(id)
        ON DELETE CASCADE,

    user_id UUID NOT NULL
        REFERENCES profiles(id)
        ON DELETE CASCADE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(problem_id, user_id)
);


-- ============================================================
-- 13. SHARES
-- ============================================================

CREATE TABLE problem_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    problem_id UUID NOT NULL
        REFERENCES problems(id)
        ON DELETE CASCADE,

    user_id UUID
        REFERENCES profiles(id)
        ON DELETE SET NULL,

    platform TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 14. TASKS
--
-- Organizations convert problems into tasks.
-- ============================================================

CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    problem_id UUID NOT NULL
        REFERENCES problems(id)
        ON DELETE CASCADE,

    organization_id UUID NOT NULL
        REFERENCES organizations(id)
        ON DELETE CASCADE,

    created_by UUID NOT NULL
        REFERENCES profiles(id)
        ON DELETE CASCADE,

    title TEXT NOT NULL,

    description TEXT,

    status task_status NOT NULL DEFAULT 'added_to_task',

    progress INTEGER NOT NULL DEFAULT 0
        CHECK (progress >= 0 AND progress <= 100),

    start_date TIMESTAMPTZ,

    due_date TIMESTAMPTZ,

    completed_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 15. TASK UPDATES
-- Keeps a history of task progress
-- ============================================================

CREATE TABLE task_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    task_id UUID NOT NULL
        REFERENCES tasks(id)
        ON DELETE CASCADE,

    user_id UUID
        REFERENCES profiles(id)
        ON DELETE SET NULL,

    status task_status,

    progress INTEGER
        CHECK (progress >= 0 AND progress <= 100),

    message TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 16. PROBLEM CONFIRMATIONS
-- Community users can confirm whether a solved problem
-- was actually fixed.
-- ============================================================

CREATE TABLE problem_confirmations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    problem_id UUID NOT NULL
        REFERENCES problems(id)
        ON DELETE CASCADE,

    user_id UUID NOT NULL
        REFERENCES profiles(id)
        ON DELETE CASCADE,

    confirmed BOOLEAN NOT NULL,

    comment TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(problem_id, user_id)
);


-- ============================================================
-- 17. NOTIFICATIONS
-- ============================================================

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL
        REFERENCES profiles(id)
        ON DELETE CASCADE,

    problem_id UUID
        REFERENCES problems(id)
        ON DELETE CASCADE,

    task_id UUID
        REFERENCES tasks(id)
        ON DELETE CASCADE,

    title TEXT NOT NULL,

    message TEXT NOT NULL,

    is_read BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 18. MACHINE LEARNING PREDICTIONS
-- Python ML system writes predictions here.
-- ============================================================

CREATE TABLE problem_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    problem_id UUID NOT NULL
        REFERENCES problems(id)
        ON DELETE CASCADE,

    predicted_category TEXT,

    predicted_priority problem_priority,

    category_confidence DOUBLE PRECISION
        CHECK (
            category_confidence IS NULL
            OR category_confidence BETWEEN 0 AND 1
        ),

    priority_confidence DOUBLE PRECISION
        CHECK (
            priority_confidence IS NULL
            OR priority_confidence BETWEEN 0 AND 1
        ),

    model_version TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 19. DEFAULT CATEGORIES
-- ============================================================

INSERT INTO problem_categories (name, description)
VALUES
('Roads', 'Road damage, potholes and transportation problems'),
('Water', 'Water supply, pipes and drainage problems'),
('Electricity', 'Electricity, power and streetlight problems'),
('Waste', 'Waste collection and sanitation problems'),
('Healthcare', 'Healthcare facilities and services'),
('Education', 'Schools and educational infrastructure'),
('Security', 'Community safety and security problems'),
('Infrastructure', 'Buildings and public infrastructure'),
('Environment', 'Environmental and pollution problems'),
('Other', 'Problems that do not fit another category');


-- ============================================================
-- 20. INDEXES
-- ============================================================

CREATE INDEX idx_problems_reported_by
ON problems(reported_by);

CREATE INDEX idx_problems_channel
ON problems(channel_id);

CREATE INDEX idx_problems_category
ON problems(category_id);

CREATE INDEX idx_problems_status
ON problems(status);

CREATE INDEX idx_problems_priority
ON problems(priority);

CREATE INDEX idx_problems_created_at
ON problems(created_at DESC);

CREATE INDEX idx_tasks_problem
ON tasks(problem_id);

CREATE INDEX idx_tasks_organization
ON tasks(organization_id);

CREATE INDEX idx_tasks_status
ON tasks(status);

CREATE INDEX idx_task_updates_task
ON task_updates(task_id);

CREATE INDEX idx_notifications_user
ON notifications(user_id);

CREATE INDEX idx_channel_followers_user
ON channel_followers(user_id);


-- ============================================================
-- DONE
-- ============================================================