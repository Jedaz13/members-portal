-- ============================================================================
-- MIGRATION 011: CREATE Q&A QUESTIONS TABLE
-- ============================================================================
-- This table stores questions submitted by members for Live Q&A sessions.
-- Questions can be submitted before sessions, and practitioners can mark
-- them as answered or skipped during the live session.

-- Create the qa_questions table
CREATE TABLE IF NOT EXISTS qa_questions (
    -- Unique ID for each question
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Which user submitted this question
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Denormalized user info for quick admin display
    user_email TEXT,
    user_name TEXT,

    -- User's protocol type for context (1-6 corresponding to protocol types)
    protocol_type INTEGER CHECK (protocol_type BETWEEN 1 AND 6),

    -- The question text (max 500 characters enforced in UI)
    question TEXT NOT NULL,

    -- Which session this question is for (date format: YYYY-MM-DD)
    session_date DATE NOT NULL,

    -- Status of the question
    -- 'pending' = awaiting answer
    -- 'answered' = answered during session
    -- 'skipped' = not answered during session
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'answered', 'skipped')),

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add helpful comments
COMMENT ON TABLE qa_questions IS 'Questions submitted by members for Live Q&A sessions';
COMMENT ON COLUMN qa_questions.protocol_type IS 'User protocol type (1=Bloating, 2=IBS-C, 3=IBS-D, 4=IBS-M, 5=Post-SIBO, 6=Gut-Brain)';
COMMENT ON COLUMN qa_questions.status IS 'Question status: pending, answered, or skipped';

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_qa_questions_session_date ON qa_questions(session_date);
CREATE INDEX IF NOT EXISTS idx_qa_questions_user_id ON qa_questions(user_id);
CREATE INDEX IF NOT EXISTS idx_qa_questions_status ON qa_questions(status);
CREATE INDEX IF NOT EXISTS idx_qa_questions_session_status ON qa_questions(session_date, status);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE qa_questions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own questions
CREATE POLICY "Users can view own questions"
ON qa_questions FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can insert their own questions
CREATE POLICY "Users can insert own questions"
ON qa_questions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own pending questions
CREATE POLICY "Users can delete own pending questions"
ON qa_questions FOR DELETE
USING (auth.uid() = user_id AND status = 'pending');

-- Policy: Practitioners can view all questions (for admin page)
CREATE POLICY "Practitioners can view all questions"
ON qa_questions FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role = 'practitioner'
    )
);

-- Policy: Practitioners can update question status
CREATE POLICY "Practitioners can update question status"
ON qa_questions FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role = 'practitioner'
    )
);

-- ============================================================================
-- TRIGGER: Auto-update updated_at timestamp
-- ============================================================================
CREATE OR REPLACE FUNCTION update_qa_questions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_qa_questions_updated_at
    BEFORE UPDATE ON qa_questions
    FOR EACH ROW
    EXECUTE FUNCTION update_qa_questions_updated_at();
