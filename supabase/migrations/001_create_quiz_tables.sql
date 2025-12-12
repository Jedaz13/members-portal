-- ============================================================================
-- GUT HEALING ACADEMY - DATABASE SETUP
-- ============================================================================
-- This SQL file creates all the tables needed for your member portal.
--
-- HOW TO RUN THIS:
-- 1. Go to your Supabase Dashboard: https://supabase.com/dashboard
-- 2. Select your project
-- 3. Click "SQL Editor" in the left sidebar
-- 4. Copy and paste this entire file
-- 5. Click "Run" (or press Cmd+Enter / Ctrl+Enter)
--
-- WHAT THIS CREATES:
-- 1. users table - stores member info, quiz responses, and subscription status
-- 2. tracking_logs table - stores daily protocol tracking entries
-- 3. messages table - stores member-practitioner communication
-- 4. Row Level Security (RLS) - protects data so users only see their own
-- 5. Helper views - makes it easy for practitioners to see unread messages
-- ============================================================================


-- ============================================================================
-- STEP 1: CREATE THE USERS TABLE
-- ============================================================================
-- This is your main table that stores everything about each member:
-- - Their identity (email, name)
-- - Their quiz answers (all 18 questions)
-- - Which protocol they were assigned
-- - Their subscription status (trial, active, etc.)

CREATE TABLE IF NOT EXISTS users (
    -- CORE IDENTITY
    -- -------------
    -- id: A unique identifier for each user (UUID = Universally Unique ID)
    --     This links to Supabase Auth, so it matches auth.users.id
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- email: Their email address (must be unique - no duplicates allowed)
    email TEXT UNIQUE NOT NULL,

    -- name: Their display name (from Google sign-in)
    name TEXT,

    -- avatar_url: Their Google profile picture
    avatar_url TEXT,

    -- created_at: When they first signed up
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- last_login_at: When they last logged in
    last_login_at TIMESTAMP WITH TIME ZONE,


    -- SAFETY SCREENING (Quiz Questions 1-4)
    -- ------------------------------------
    -- These identify red flags that need medical attention

    -- has_red_flags: TRUE if they answered YES to any red flag question
    has_red_flags BOOLEAN DEFAULT FALSE,

    -- red_flag_details: Stores which specific red flags were triggered
    -- Example: {"unexplained_weight_loss": true, "blood_in_stool": false, "fever": true}
    red_flag_details JSONB,


    -- PROTOCOL ASSIGNMENT
    -- -------------------
    -- After completing the quiz, users are assigned to 1 of 6 protocols

    -- protocol: The protocol number (1-6)
    protocol INTEGER CHECK (protocol BETWEEN 1 AND 6),

    -- protocol_name: Human-readable name for easy reference
    -- Protocol 1 = "Bloating-Dominant"
    -- Protocol 2 = "IBS-C" (Constipation)
    -- Protocol 3 = "IBS-D" (Diarrhea)
    -- Protocol 4 = "IBS-M" (Mixed)
    -- Protocol 5 = "Post-SIBO"
    -- Protocol 6 = "Gut-Brain"
    protocol_name TEXT,

    -- has_stress_component: TRUE if stress significantly affects their symptoms
    has_stress_component BOOLEAN DEFAULT FALSE,


    -- SYMPTOM PATTERN (Quiz Questions 5-9)
    -- ------------------------------------

    -- Q5: What's your primary digestive complaint?
    primary_complaint TEXT,

    -- Q6: How often do you experience symptoms?
    symptom_frequency TEXT,

    -- Q7: Do you feel relief after a bowel movement?
    relief_after_bm TEXT,

    -- Q8: During a flare-up, how often do you go to the bathroom?
    frequency_during_flare TEXT,

    -- Q9: What does your stool look like during a flare-up?
    stool_during_flare TEXT,


    -- HISTORY (Quiz Questions 10-12)
    -- ------------------------------

    -- Q10: How long have you been dealing with these symptoms?
    duration TEXT,

    -- Q11: Have you been diagnosed with any of these conditions?
    -- This is an ARRAY (list) because they can select multiple
    -- Example: ["IBS", "SIBO", "Food sensitivities"]
    diagnoses TEXT[],

    -- Q12: What treatments have you already tried?
    -- Also an array for multiple selections
    -- Example: ["Probiotics", "Elimination diet", "Prescription medication"]
    treatments_tried TEXT[],


    -- GUT-BRAIN CONNECTION (Quiz Questions 13-15)
    -- -------------------------------------------

    -- Q13: Does stress make your symptoms worse?
    stress_connection TEXT,

    -- Q14: How has this affected your mental health?
    mental_health_impact TEXT,

    -- Q15: How is your sleep quality?
    sleep_quality TEXT,


    -- LIFE IMPACT (Quiz Questions 16-18)
    -- ----------------------------------

    -- Q16: How much does this affect your daily life? (1-10 scale)
    life_impact_level TEXT,

    -- Q17: What's the hardest part about dealing with this?
    -- Free text - they can write anything
    hardest_part TEXT,

    -- Q18: If you could wave a magic wand, what would your life look like?
    -- Free text - their dream outcome
    dream_outcome TEXT,


    -- MEMBERSHIP STATUS
    -- -----------------

    -- role: Either 'member' (regular user) or 'practitioner' (admin/coach)
    role TEXT DEFAULT 'member' CHECK (role IN ('member', 'practitioner')),

    -- status: Their subscription state
    -- 'lead' = took quiz but hasn't started trial
    -- 'trial' = in 7-day free trial
    -- 'active' = paying subscriber
    -- 'trial_expired' = trial ended without subscribing
    -- 'cancelled' = was active but cancelled
    status TEXT DEFAULT 'lead' CHECK (status IN ('lead', 'trial', 'active', 'trial_expired', 'cancelled')),

    -- trial_start_date: When their 7-day trial began
    trial_start_date TIMESTAMP WITH TIME ZONE,

    -- subscription_type: If they're paying, which plan?
    subscription_type TEXT CHECK (subscription_type IN ('monthly', '6month'))
);

-- Add a comment to the table (shows up in Supabase dashboard)
COMMENT ON TABLE users IS 'Stores member profiles, quiz responses, and subscription status';


-- ============================================================================
-- STEP 2: CREATE THE TRACKING_LOGS TABLE
-- ============================================================================
-- This stores daily tracking entries for each protocol.
-- Members log their symptoms, habits, and progress daily.
-- Each protocol tracks different things (stored in the tracking_data JSONB field).

CREATE TABLE IF NOT EXISTS tracking_logs (
    -- Unique ID for each log entry
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Which user made this entry (links to users table)
    -- ON DELETE CASCADE means: if user is deleted, their logs are too
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- The date of this tracking entry
    date DATE NOT NULL,

    -- Which protocol this tracking is for (should match user's assigned protocol)
    protocol_type INTEGER CHECK (protocol_type BETWEEN 1 AND 6),

    -- The actual tracking data (flexible JSON structure)
    -- Different fields based on protocol:
    --
    -- Protocol 1 (Bloating-Dominant):
    --   {"morning_belly_score": 3, "evening_bloating_score": 7, "meal_pace_maintained": true}
    --
    -- Protocol 2 (IBS-C - Constipation):
    --   {"had_bowel_movement": true, "stool_appearance": "hard pellets", "morning_water_done": true}
    --
    -- Protocol 3 (IBS-D - Diarrhea):
    --   {"bathroom_visit_count": 4, "stool_consistency": "watery", "urgency_episodes": 2}
    --
    -- Protocol 4 (IBS-M - Mixed):
    --   {"todays_pattern": "constipation", "stool_consistency": "hard", "meals_on_schedule": true}
    --
    -- Protocol 5 (Post-SIBO):
    --   {"symptom_return_level": 2, "meal_spacing_maintained": true, "overnight_fast_hours": 14}
    --
    -- Protocol 6 (Gut-Brain):
    --   {"highest_stress_level": 8, "worst_gut_symptom": "cramping", "vagus_practice_done": true}
    --
    tracking_data JSONB NOT NULL,

    -- Optional notes the user can add
    notes TEXT,

    -- When this entry was created
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- UNIQUE constraint: only one entry per user per day
    -- This prevents accidental duplicate entries
    UNIQUE(user_id, date)
);

-- Add helpful comments
COMMENT ON TABLE tracking_logs IS 'Daily symptom and habit tracking for each protocol';
COMMENT ON COLUMN tracking_logs.tracking_data IS 'Protocol-specific tracking fields stored as JSON';


-- ============================================================================
-- STEP 3: CREATE THE MESSAGES TABLE
-- ============================================================================
-- This enables 1-on-1 communication between members and practitioners.
-- Messages are tied to a specific member (user_id), and can be sent by
-- either the member or a practitioner.

CREATE TABLE IF NOT EXISTS messages (
    -- Unique ID for each message
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Which member this conversation belongs to
    -- (practitioners can message multiple members, but each message
    --  is associated with ONE member's conversation thread)
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Who sent this message: 'member' or 'practitioner'
    sender_type TEXT NOT NULL CHECK (sender_type IN ('member', 'practitioner')),

    -- Email of the person who sent it (for display purposes)
    sender_email TEXT NOT NULL,

    -- The actual message content
    message_text TEXT NOT NULL,

    -- When the message was sent
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- When the message was read (NULL = unread)
    -- This helps track which messages need attention
    read_at TIMESTAMP WITH TIME ZONE
);

-- Add helpful comments
COMMENT ON TABLE messages IS 'Member-practitioner communication';
COMMENT ON COLUMN messages.read_at IS 'NULL means unread, timestamp means read at that time';


-- ============================================================================
-- STEP 4: CREATE INDEXES FOR BETTER PERFORMANCE
-- ============================================================================
-- Indexes make queries faster. Think of them like the index in a book -
-- instead of reading every page, you can jump directly to what you need.

-- Fast lookup of tracking logs by user
CREATE INDEX IF NOT EXISTS idx_tracking_logs_user_id ON tracking_logs(user_id);

-- Fast lookup of tracking logs by date
CREATE INDEX IF NOT EXISTS idx_tracking_logs_date ON tracking_logs(date);

-- Fast lookup of messages by user
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);

-- Fast lookup of unread messages
CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(read_at) WHERE read_at IS NULL;

-- Fast lookup of users by status (e.g., find all trial users)
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- Fast lookup of users by role (e.g., find all practitioners)
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);


-- ============================================================================
-- STEP 5: ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================================================
-- RLS is like a bouncer at a club - it controls who can see/change what data.
-- Without RLS, anyone with your Supabase anon key could read ALL data!
-- With RLS, users can only access data they're allowed to see.

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracking_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;


-- ============================================================================
-- STEP 6: CREATE RLS POLICIES FOR USERS TABLE
-- ============================================================================

-- Policy: Members can view their OWN profile
CREATE POLICY "Members can view own profile"
    ON users
    FOR SELECT
    USING (auth.uid() = id);

-- Policy: Members can update their OWN profile
CREATE POLICY "Members can update own profile"
    ON users
    FOR UPDATE
    USING (auth.uid() = id);

-- Policy: Members can insert their own profile (for initial sign-up)
CREATE POLICY "Members can insert own profile"
    ON users
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Policy: Practitioners can view ALL user profiles
-- (So they can see member info, quiz results, etc.)
CREATE POLICY "Practitioners can view all profiles"
    ON users
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND role = 'practitioner'
        )
    );

-- Policy: Practitioners can update any user profile
-- (So they can change subscription status, etc.)
CREATE POLICY "Practitioners can update all profiles"
    ON users
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND role = 'practitioner'
        )
    );


-- ============================================================================
-- STEP 7: CREATE RLS POLICIES FOR TRACKING_LOGS TABLE
-- ============================================================================

-- Policy: Members can view their OWN tracking logs
CREATE POLICY "Members can view own tracking logs"
    ON tracking_logs
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Members can create their OWN tracking logs
CREATE POLICY "Members can create own tracking logs"
    ON tracking_logs
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Members can update their OWN tracking logs
CREATE POLICY "Members can update own tracking logs"
    ON tracking_logs
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Policy: Members can delete their OWN tracking logs
CREATE POLICY "Members can delete own tracking logs"
    ON tracking_logs
    FOR DELETE
    USING (auth.uid() = user_id);

-- Policy: Practitioners can view ALL tracking logs
-- (So they can monitor member progress)
CREATE POLICY "Practitioners can view all tracking logs"
    ON tracking_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND role = 'practitioner'
        )
    );


-- ============================================================================
-- STEP 8: CREATE RLS POLICIES FOR MESSAGES TABLE
-- ============================================================================

-- Policy: Members can view messages in their conversation
CREATE POLICY "Members can view own messages"
    ON messages
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Members can send messages (create) in their conversation
CREATE POLICY "Members can send messages"
    ON messages
    FOR INSERT
    WITH CHECK (
        auth.uid() = user_id
        AND sender_type = 'member'
    );

-- Policy: Members can update their own messages (e.g., mark as read)
CREATE POLICY "Members can update own messages"
    ON messages
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Policy: Practitioners can view ALL messages
CREATE POLICY "Practitioners can view all messages"
    ON messages
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND role = 'practitioner'
        )
    );

-- Policy: Practitioners can send messages to any member
CREATE POLICY "Practitioners can send messages"
    ON messages
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND role = 'practitioner'
        )
        AND sender_type = 'practitioner'
    );

-- Policy: Practitioners can update any message (e.g., mark as read)
CREATE POLICY "Practitioners can update all messages"
    ON messages
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND role = 'practitioner'
        )
    );


-- ============================================================================
-- STEP 9: CREATE HELPER VIEW FOR UNREAD MESSAGES
-- ============================================================================
-- Views are like saved queries - they make it easy to get common data.
-- This view shows all unread messages with member info for practitioners.

CREATE OR REPLACE VIEW unread_messages_view AS
SELECT
    m.id AS message_id,
    m.user_id,
    u.email AS member_email,
    u.name AS member_name,
    u.protocol_name,
    m.sender_type,
    m.sender_email,
    m.message_text,
    m.created_at
FROM messages m
JOIN users u ON m.user_id = u.id
WHERE m.read_at IS NULL
ORDER BY m.created_at DESC;

-- Add a comment explaining the view
COMMENT ON VIEW unread_messages_view IS 'Shows all unread messages with member details - for practitioner dashboard';


-- ============================================================================
-- STEP 10: CREATE HELPER FUNCTION TO ADD A PRACTITIONER
-- ============================================================================
-- This function lets you easily promote a user to practitioner role.
-- You'll call this manually to whitelist practitioner emails.

CREATE OR REPLACE FUNCTION make_practitioner(user_email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    affected_rows INTEGER;
BEGIN
    UPDATE users
    SET role = 'practitioner'
    WHERE email = user_email;

    GET DIAGNOSTICS affected_rows = ROW_COUNT;

    IF affected_rows > 0 THEN
        RETURN 'Success! ' || user_email || ' is now a practitioner.';
    ELSE
        RETURN 'User not found. Make sure they have logged in at least once.';
    END IF;
END;
$$;

COMMENT ON FUNCTION make_practitioner IS 'Promotes a user to practitioner role by email';


-- ============================================================================
-- STEP 11: CREATE FUNCTION TO START A TRIAL
-- ============================================================================
-- Call this when a user completes the quiz to start their 7-day trial.

CREATE OR REPLACE FUNCTION start_trial(user_id_param UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE users
    SET
        status = 'trial',
        trial_start_date = NOW()
    WHERE id = user_id_param;
END;
$$;

COMMENT ON FUNCTION start_trial IS 'Starts a 7-day trial for a user after quiz completion';


-- ============================================================================
-- STEP 12: CREATE FUNCTION TO CHECK IF TRIAL HAS EXPIRED
-- ============================================================================
-- Returns TRUE if the user's trial has expired (more than 7 days old).
-- You can call this when a user logs in to check their status.

CREATE OR REPLACE FUNCTION is_trial_expired(user_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    trial_start TIMESTAMP WITH TIME ZONE;
    user_status TEXT;
BEGIN
    SELECT trial_start_date, status INTO trial_start, user_status
    FROM users
    WHERE id = user_id_param;

    -- If they're not on trial, return false
    IF user_status != 'trial' THEN
        RETURN FALSE;
    END IF;

    -- If no trial start date, return false
    IF trial_start IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Check if more than 7 days have passed
    RETURN NOW() > trial_start + INTERVAL '7 days';
END;
$$;

COMMENT ON FUNCTION is_trial_expired IS 'Checks if a user trial has exceeded 7 days';


-- ============================================================================
-- DONE!
-- ============================================================================
-- Your database is now set up. Here's what you can do next:
--
-- 1. ADD A PRACTITIONER:
--    Run this in SQL Editor (replace with the real email):
--    SELECT make_practitioner('your-practitioner@email.com');
--
-- 2. VIEW UNREAD MESSAGES:
--    Run this in SQL Editor:
--    SELECT * FROM unread_messages_view;
--
-- 3. START A USER'S TRIAL:
--    SELECT start_trial('user-uuid-here');
--
-- 4. CHECK IF TRIAL EXPIRED:
--    SELECT is_trial_expired('user-uuid-here');
--
-- ============================================================================
