-- Supabase Database Schema for ChatAI Application
-- Run these SQL commands in your Supabase SQL editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  display_name TEXT,
  photo_url TEXT,
  bio TEXT,
  status TEXT DEFAULT 'offline' CHECK (status IN ('online', 'away', 'busy', 'offline')),
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  settings JSONB DEFAULT '{
    "theme": "light",
    "notifications": true,
    "privacy": {
      "showLastSeen": true,
      "showOnlineStatus": true
    },
    "aiPreferences": {
      "personality": "helpful",
      "responseLength": "medium"
    }
  }'::jsonb
);

-- Create chats table
CREATE TABLE IF NOT EXISTS chats (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('private', 'group', 'ai')),
  name TEXT,
  description TEXT,
  photo_url TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  settings JSONB DEFAULT '{}'::jsonb
);

-- Create chat_participants table
CREATE TABLE IF NOT EXISTS chat_participants (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(chat_id, user_id)
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  content JSONB NOT NULL,
  message_type TEXT DEFAULT 'user' CHECK (message_type IN ('user', 'ai', 'system')),
  reply_to UUID REFERENCES messages(id) ON DELETE SET NULL,
  edited BOOLEAN DEFAULT FALSE,
  edited_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reactions JSONB DEFAULT '{}'::jsonb
);

-- Create message_reads table
CREATE TABLE IF NOT EXISTS message_reads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, user_id)
);

-- Create ai_conversations table
CREATE TABLE IF NOT EXISTS ai_conversations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
  context JSONB DEFAULT '{}'::jsonb,
  personality TEXT DEFAULT 'helpful',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_status ON user_profiles(status);
CREATE INDEX IF NOT EXISTS idx_chats_type ON chats(type);
CREATE INDEX IF NOT EXISTS idx_chats_created_by ON chats(created_by);
CREATE INDEX IF NOT EXISTS idx_chat_participants_chat_id ON chat_participants(chat_id);
CREATE INDEX IF NOT EXISTS idx_chat_participants_user_id ON chat_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_message_reads_message_id ON message_reads(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reads_user_id ON message_reads(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id ON ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_chat_id ON ai_conversations(chat_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_chats_updated_at BEFORE UPDATE ON chats FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ai_conversations_updated_at BEFORE UPDATE ON ai_conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to handle user profile creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, email, display_name, photo_url, email_verified)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.email_confirmed_at IS NOT NULL
  );
  RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;

-- User profiles policies
CREATE POLICY "Users can view all profiles" ON user_profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);

-- Chats policies
CREATE POLICY "Users can view chats they participate in" ON chats FOR SELECT USING (
  id IN (SELECT chat_id FROM chat_participants WHERE user_id = auth.uid())
);
CREATE POLICY "Users can create chats" ON chats FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Chat admins can update chats" ON chats FOR UPDATE USING (
  id IN (SELECT chat_id FROM chat_participants WHERE user_id = auth.uid() AND role = 'admin')
);

-- Chat participants policies
CREATE POLICY "Users can view participants of their chats" ON chat_participants FOR SELECT USING (
  chat_id IN (SELECT chat_id FROM chat_participants WHERE user_id = auth.uid())
);
CREATE POLICY "Chat admins can manage participants" ON chat_participants FOR ALL USING (
  chat_id IN (SELECT chat_id FROM chat_participants WHERE user_id = auth.uid() AND role = 'admin')
);

-- Messages policies
CREATE POLICY "Users can view messages in their chats" ON messages FOR SELECT USING (
  chat_id IN (SELECT chat_id FROM chat_participants WHERE user_id = auth.uid())
);
CREATE POLICY "Users can send messages to their chats" ON messages FOR INSERT WITH CHECK (
  chat_id IN (SELECT chat_id FROM chat_participants WHERE user_id = auth.uid()) AND
  sender_id = auth.uid()
);
CREATE POLICY "Users can update their own messages" ON messages FOR UPDATE USING (sender_id = auth.uid());
CREATE POLICY "Users can delete their own messages" ON messages FOR DELETE USING (sender_id = auth.uid());

-- Message reads policies
CREATE POLICY "Users can view message reads in their chats" ON message_reads FOR SELECT USING (
  message_id IN (SELECT id FROM messages WHERE chat_id IN (SELECT chat_id FROM chat_participants WHERE user_id = auth.uid()))
);
CREATE POLICY "Users can mark messages as read" ON message_reads FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their own read status" ON message_reads FOR UPDATE USING (user_id = auth.uid());

-- AI conversations policies
CREATE POLICY "Users can view their own AI conversations" ON ai_conversations FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create AI conversations" ON ai_conversations FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their own AI conversations" ON ai_conversations FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete their own AI conversations" ON ai_conversations FOR DELETE USING (user_id = auth.uid());