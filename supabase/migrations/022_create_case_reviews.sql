-- ============================================================================
-- MIGRATION 022: CREATE CASE REVIEWS TABLE
-- ============================================================================
-- This table stores case review submissions from the upsell page.
-- Rebecca and Paulina review cases and write personal responses via admin.

-- Create the case_reviews table
CREATE TABLE IF NOT EXISTS case_reviews (
    -- Unique ID for each case review (matches review_id from upsell page)
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Customer info
    email TEXT NOT NULL,
    name TEXT,

    -- Payment info
    stripe_session_id TEXT,
    stripe_payment_intent TEXT,
    paid_at TIMESTAMP WITH TIME ZONE,

    -- Quiz context (from URL params)
    protocol TEXT,
    protocol_name TEXT,
    primary_complaint TEXT,
    primary_complaint_label TEXT,
    duration TEXT,
    diagnoses TEXT,
    treatments_formatted TEXT,
    stress_level TEXT,
    life_impact TEXT,
    gut_brain TEXT,
    goal TEXT,

    -- Questions submitted by customer
    question_1 TEXT,
    question_2 TEXT,
    question_3 TEXT,
    question_4 TEXT,
    question_5 TEXT,
    question_6 TEXT,

    -- Additional info
    current_supplements TEXT,
    additional_notes TEXT,

    -- File uploads (JSON array of {name, path, url, type, size})
    uploaded_files JSONB DEFAULT '[]'::jsonb,

    -- Review status
    -- 'submitted' = paid and awaiting review
    -- 'in_review' = reviewer has started working on it
    -- 'completed' = response sent to customer
    status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'in_review', 'completed')),

    -- Priority flag
    priority BOOLEAN DEFAULT false,

    -- Response from reviewer
    response_text TEXT,
    response_by TEXT,
    completed_at TIMESTAMP WITH TIME ZONE,

    -- Draft support
    draft_text TEXT,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add helpful comments
COMMENT ON TABLE case_reviews IS 'Personal case reviews submitted via upsell page, reviewed by Rebecca/Paulina';
COMMENT ON COLUMN case_reviews.status IS 'Review status: submitted, in_review, or completed';
COMMENT ON COLUMN case_reviews.response_by IS 'Name of reviewer who wrote the response';

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_case_reviews_email ON case_reviews(email);
CREATE INDEX IF NOT EXISTS idx_case_reviews_status ON case_reviews(status);
CREATE INDEX IF NOT EXISTS idx_case_reviews_created_at ON case_reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_case_reviews_status_created ON case_reviews(status, created_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE case_reviews ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view all case reviews
CREATE POLICY "Admins can view all case reviews"
ON case_reviews FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND (users.is_admin = true OR users.role = 'practitioner')
    )
);

-- Policy: Admins can update case reviews (for responses)
CREATE POLICY "Admins can update case reviews"
ON case_reviews FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND (users.is_admin = true OR users.role = 'practitioner')
    )
);

-- Policy: Admins can insert case reviews (for webhook/manual creation)
CREATE POLICY "Admins can insert case reviews"
ON case_reviews FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND (users.is_admin = true OR users.role = 'practitioner')
    )
);

-- Policy: Service role can do everything (for Make.com webhook)
-- Note: service_role key bypasses RLS by default, so no policy needed for webhooks

-- Policy: Customers can view their own case reviews (by email match)
CREATE POLICY "Customers can view own case reviews"
ON case_reviews FOR SELECT
USING (
    email = (
        SELECT auth.jwt() ->> 'email'
    )
);

-- ============================================================================
-- TRIGGER: Auto-update updated_at timestamp
-- ============================================================================
CREATE OR REPLACE FUNCTION update_case_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_case_reviews_updated_at
    BEFORE UPDATE ON case_reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_case_reviews_updated_at();
