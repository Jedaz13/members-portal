-- ============================================================================
-- MIGRATION 013: ADD ADMIN EMAIL-BASED POLICIES FOR Q&A QUESTIONS
-- ============================================================================
-- This migration adds RLS policies that allow specific admin emails to
-- view and update Q&A questions, without requiring them to be practitioners.

-- Policy: Admins can view all questions (by email)
CREATE POLICY "Admins can view all questions"
ON qa_questions FOR SELECT
USING (
    auth.email() IN (
        'gedaskvedaras7@gmail.com',
        'rebecca@guthealingacademy.com',
        'andrzejewska.dietetyk@gmail.com'
    )
);

-- Policy: Admins can update question status (by email)
CREATE POLICY "Admins can update questions"
ON qa_questions FOR UPDATE
USING (
    auth.email() IN (
        'gedaskvedaras7@gmail.com',
        'rebecca@guthealingacademy.com',
        'andrzejewska.dietetyk@gmail.com'
    )
);

-- Add helpful comment
COMMENT ON POLICY "Admins can view all questions" ON qa_questions IS 'Allows whitelisted admin emails to view all Q&A questions';
COMMENT ON POLICY "Admins can update questions" ON qa_questions IS 'Allows whitelisted admin emails to update question status';
