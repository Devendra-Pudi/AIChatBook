-- Migration: Message Management Features
-- Description: Add tables and columns for message editing, deletion tracking, drafts, and forwarding

-- Add forwarded_from column to messages table to track forwarded messages
ALTER TABLE messages 
ADD COLUMN forwarded_from UUID REFERENCES messages(message_id) ON DELETE SET NULL;

-- Create message_deletions table for soft deletes
CREATE TABLE IF NOT EXISTS message_deletions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES messages(message_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    deleted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Ensure one deletion record per user per message
    UNIQUE(message_id, user_id)
);

-- Create message_drafts table for saving drafts
CREATE TABLE IF NOT EXISTS message_drafts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    chat_id UUID NOT NULL REFERENCES chats(chat_id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    reply_to UUID REFERENCES messages(message_id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Ensure one draft per user per chat
    UNIQUE(user_id, chat_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_message_deletions_message_id ON message_deletions(message_id);
CREATE INDEX IF NOT EXISTS idx_message_deletions_user_id ON message_deletions(user_id);
CREATE INDEX IF NOT EXISTS idx_message_deletions_deleted_at ON message_deletions(deleted_at);

CREATE INDEX IF NOT EXISTS idx_message_drafts_user_id ON message_drafts(user_id);
CREATE INDEX IF NOT EXISTS idx_message_drafts_chat_id ON message_drafts(chat_id);
CREATE INDEX IF NOT EXISTS idx_message_drafts_updated_at ON message_drafts(updated_at);

CREATE INDEX IF NOT EXISTS idx_messages_forwarded_from ON messages(forwarded_from);

-- Enable RLS (Row Level Security) for the new tables
ALTER TABLE message_deletions ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_drafts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for message_deletions
CREATE POLICY "Users can view their own message deletions" ON message_deletions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own message deletions" ON message_deletions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own message deletions" ON message_deletions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own message deletions" ON message_deletions
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for message_drafts
CREATE POLICY "Users can view their own drafts" ON message_drafts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own drafts" ON message_drafts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own drafts" ON message_drafts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own drafts" ON message_drafts
    FOR DELETE USING (auth.uid() = user_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at for message_drafts
CREATE TRIGGER update_message_drafts_updated_at 
    BEFORE UPDATE ON message_drafts 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Function to clean up old drafts (older than 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_drafts()
RETURNS void AS $$
BEGIN
    DELETE FROM message_drafts 
    WHERE updated_at < NOW() - INTERVAL '30 days';
END;
$$ language 'plpgsql';

-- Create a scheduled job to clean up old drafts (if pg_cron is available)
-- This would typically be set up in the database administration panel
-- SELECT cron.schedule('cleanup-old-drafts', '0 2 * * *', 'SELECT cleanup_old_drafts();');

COMMENT ON TABLE message_deletions IS 'Tracks soft deletions of messages per user';
COMMENT ON TABLE message_drafts IS 'Stores message drafts for users per chat';
COMMENT ON COLUMN messages.forwarded_from IS 'References the original message if this is a forwarded message';
COMMENT ON FUNCTION cleanup_old_drafts() IS 'Removes draft messages older than 30 days';