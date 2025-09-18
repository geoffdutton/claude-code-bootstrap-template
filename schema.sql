-- Cloudflare Agent Database Schema
-- Run with: wrangler d1 execute agent-conversations --file=./schema.sql

-- Conversations table for storing chat history
CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    metadata TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Index for efficient conversation retrieval
CREATE INDEX IF NOT EXISTS idx_conversation_id_timestamp 
ON conversations(conversation_id, timestamp DESC);

-- Index for conversation cleanup and analytics
CREATE INDEX IF NOT EXISTS idx_created_at 
ON conversations(created_at);

-- Index for role-based queries
CREATE INDEX IF NOT EXISTS idx_role 
ON conversations(role);