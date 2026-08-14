# Database Schema Definition: Prompt Filmz

The "Prompt Filmz" application currently utilizes **Google Cloud Firestore**, a NoSQL document database. This is highly suitable for the app's real-time collaboration features (like the script editor and storyboard), seamless offline support, and rapid scaling.

However, as requested, below is the formal database schema definition translated into a **PostgreSQL** relational schema. This SQL definition accurately represents all the data models, relationships, and application-specific content currently managed in the application.

## PostgreSQL Schema (`schema.sql`)

```sql
-- ==========================================
-- Prompt Filmz - PostgreSQL Schema
-- ==========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Profiles Table (User Data)
CREATE TABLE profiles (
    id UUID PRIMARY KEY, -- Maps to Firebase Auth UID
    display_name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    free_fest_used BOOLEAN DEFAULT FALSE,
    tokens INTEGER DEFAULT 0, -- AI credit balance
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enum for project phases
CREATE TYPE project_status AS ENUM (
    'scripting', 
    'pre-production', 
    'storyboard', 
    'editing', 
    'released'
);

-- 2. Projects Table
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status project_status DEFAULT 'scripting',
    thumbnail_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Scripts Table (1-to-1 with Project)
CREATE TABLE scripts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL UNIQUE REFERENCES projects(id) ON DELETE CASCADE,
    content TEXT,
    last_ai_suggestion TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Characters Table (Character Bible)
CREATE TABLE characters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL, -- Null implies "Global" character
    name VARCHAR(255) NOT NULL,
    role VARCHAR(100),
    visual_description TEXT,
    personality TEXT,
    backstory TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Shots Table (Storyboard & Shot List)
CREATE TABLE shots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    shot_code VARCHAR(50) NOT NULL,
    scene_number VARCHAR(50),
    shot_type VARCHAR(100),
    angle VARCHAR(100),
    movement VARCHAR(100),
    camera_angle VARCHAR(100),
    lens VARCHAR(100),
    motion_intensity INTEGER,
    duration VARCHAR(50),
    description TEXT NOT NULL,
    prompt TEXT,
    sort_order INTEGER DEFAULT 0,
    is_completed BOOLEAN DEFAULT FALSE,
    thumbnail_url TEXT,
    video_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_characters_user_id ON characters(user_id);
CREATE INDEX idx_characters_project_id ON characters(project_id);
CREATE INDEX idx_shots_project_id_sort ON shots(project_id, sort_order);
```

## Current Firestore (NoSQL) Collections

For reference, here is how this schema is actively mapped in the live application's Firebase Firestore environment:

*   **`/profiles/{userId}`**: Stores user profiles. The document ID maps to the authenticated user's ID.
*   **`/projects/{projectId}`**: Stores the projects created by users.
*   **`/scripts/{scriptId}`**: Stores screenplay content. Typically, the `scriptId` aligns with or references a `projectId`.
*   **`/characters/{characterId}`**: Stores character bible profiles. Uses `project_id` to scope characters to specific projects, or marks them as global.
*   **`/shots/{shotId}`**: Stores individual storyboard frames and shot list configurations.

## Architecture Notes
*   **Transactions**: The app relies on Firestore atomic transactions for credit/token deductions (e.g., deducting 3 tokens for AI avatar generation).
*   **Security**: Access is governed by `firestore.rules`, ensuring users can only read/write `projects`, `shots`, `scripts`, and `characters` where `user_id == request.auth.uid`.
