-- Migration: Create live_qa_rsvps table for tracking Q&A session RSVPs
-- Created: 2025-01-13

-- Create the live_qa_rsvps table
CREATE TABLE IF NOT EXISTS live_qa_rsvps (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_date DATE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(session_date, user_id)
);

-- Enable Row Level Security
ALTER TABLE live_qa_rsvps ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone authenticated can view RSVP counts (for displaying the count)
CREATE POLICY "Anyone can view RSVP counts" ON live_qa_rsvps
    FOR SELECT USING (auth.role() = 'authenticated');

-- Policy: Users can only insert their own RSVP
CREATE POLICY "Users can RSVP for themselves" ON live_qa_rsvps
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own RSVP (in case they want to un-RSVP)
CREATE POLICY "Users can delete their own RSVP" ON live_qa_rsvps
    FOR DELETE USING (auth.uid() = user_id);

-- Create index for faster lookups by session_date
CREATE INDEX IF NOT EXISTS idx_live_qa_rsvps_session_date ON live_qa_rsvps(session_date);

-- Create index for faster lookups by user_id
CREATE INDEX IF NOT EXISTS idx_live_qa_rsvps_user_id ON live_qa_rsvps(user_id);

-- Comment on table
COMMENT ON TABLE live_qa_rsvps IS 'Tracks RSVPs for live Q&A sessions. Base count starts at 7 (handled in application code).';
