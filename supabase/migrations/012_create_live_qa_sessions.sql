-- ============================================================================
-- MIGRATION 012: CREATE LIVE Q&A SESSIONS TABLE
-- ============================================================================
-- This table stores Live Q&A session details.
-- Allows admins to schedule sessions dynamically instead of hardcoding in JS.

-- Create the live_qa_sessions table
CREATE TABLE IF NOT EXISTS live_qa_sessions (
    -- Unique ID for each session
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Session date (YYYY-MM-DD format)
    session_date DATE NOT NULL UNIQUE,

    -- Session time (e.g., "4:00 PM")
    session_time TEXT NOT NULL,

    -- Timezone (e.g., "GMT", "ET", "PT")
    timezone TEXT DEFAULT 'GMT',

    -- Session topic/title
    topic TEXT,

    -- Host practitioner (references users table)
    host_id UUID REFERENCES users(id) ON DELETE SET NULL,

    -- Zoom meeting link
    zoom_link TEXT,

    -- Session status
    -- 'scheduled' = upcoming session
    -- 'live' = currently happening
    -- 'completed' = session finished
    -- 'cancelled' = session was cancelled
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'completed', 'cancelled')),

    -- Recording URL (filled after session is completed)
    recording_url TEXT,

    -- Notes for admins
    notes TEXT,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add helpful comments
COMMENT ON TABLE live_qa_sessions IS 'Stores Live Q&A session schedule and details';
COMMENT ON COLUMN live_qa_sessions.session_date IS 'Date of the session (one session per date)';
COMMENT ON COLUMN live_qa_sessions.host_id IS 'Practitioner hosting the session';
COMMENT ON COLUMN live_qa_sessions.status IS 'Session status: scheduled, live, completed, cancelled';

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_live_qa_sessions_date ON live_qa_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_live_qa_sessions_status ON live_qa_sessions(status);
CREATE INDEX IF NOT EXISTS idx_live_qa_sessions_upcoming ON live_qa_sessions(session_date, status)
    WHERE status = 'scheduled';

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE live_qa_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can view scheduled/live sessions (for the member portal)
CREATE POLICY "Anyone can view sessions"
ON live_qa_sessions FOR SELECT
USING (true);

-- Policy: Only practitioners can insert sessions
CREATE POLICY "Practitioners can insert sessions"
ON live_qa_sessions FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role = 'practitioner'
    )
);

-- Policy: Only practitioners can update sessions
CREATE POLICY "Practitioners can update sessions"
ON live_qa_sessions FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role = 'practitioner'
    )
);

-- Policy: Only practitioners can delete sessions
CREATE POLICY "Practitioners can delete sessions"
ON live_qa_sessions FOR DELETE
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
CREATE OR REPLACE FUNCTION update_live_qa_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_live_qa_sessions_updated_at
    BEFORE UPDATE ON live_qa_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_live_qa_sessions_updated_at();

-- ============================================================================
-- INSERT INITIAL SESSION (Current hardcoded session)
-- ============================================================================
-- This inserts the currently hardcoded session so it's in the database
INSERT INTO live_qa_sessions (
    session_date,
    session_time,
    timezone,
    topic,
    host_id,
    zoom_link,
    status
) VALUES (
    '2025-01-16',
    '4:00 PM',
    'GMT',
    'Why Cutting Foods for Bloating Often Backfires',
    'abcaa567-8e12-4038-a300-9fc8c24d785a',  -- Rebecca Taylor's user ID
    'https://us05web.zoom.us/j/84554916315?pwd=mgMsFhs8NMpz3FqaktOKyabi0gEOlD.1',
    'scheduled'
) ON CONFLICT (session_date) DO NOTHING;
