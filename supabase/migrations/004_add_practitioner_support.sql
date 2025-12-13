-- ============================================================================
-- GUT HEALING ACADEMY - PRACTITIONER DASHBOARD SUPPORT
-- ============================================================================
-- This migration adds all tables and fields needed for the practitioner dashboard
--
-- HOW TO RUN THIS:
-- 1. Go to your Supabase Dashboard: https://supabase.com/dashboard
-- 2. Select your project
-- 3. Click "SQL Editor" in the left sidebar
-- 4. Copy and paste this entire file
-- 5. Click "Run" (or press Cmd+Enter / Ctrl+Enter)
--
-- WHAT THIS CREATES:
-- 1. Adds practitioner-specific fields to users table
-- 2. patient_assignments table - links practitioners to their patients
-- 3. practitioner_alerts table - stores alerts for practitioners
-- 4. custom_tracking_metrics table - custom tracking fields per patient
-- 5. Functions to support practitioner workflows
-- 6. RLS policies for practitioner access
-- ============================================================================


-- ============================================================================
-- STEP 1: ADD PRACTITIONER FIELDS TO USERS TABLE
-- ============================================================================
-- Add fields to support practitioner profiles and referral system

-- Practitioner credentials (e.g., "RNutr, Registered Clinical Nutritionist")
ALTER TABLE users ADD COLUMN IF NOT EXISTS credentials TEXT;

-- Practitioner bio (shown in profile)
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;

-- Array of specializations (e.g., ['bloating', 'post_sibo', 'gut_brain'])
ALTER TABLE users ADD COLUMN IF NOT EXISTS specializations TEXT[];

-- Unique referral code for practitioners (e.g., 'rebecca-gut')
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;

-- Practitioner status ('available', 'busy', 'offline')
ALTER TABLE users ADD COLUMN IF NOT EXISTS practitioner_status TEXT DEFAULT 'available'
    CHECK (practitioner_status IN ('available', 'busy', 'offline'));

-- Add comments
COMMENT ON COLUMN users.credentials IS 'Practitioner credentials and qualifications';
COMMENT ON COLUMN users.bio IS 'Practitioner bio shown in profile';
COMMENT ON COLUMN users.specializations IS 'Array of protocol specializations';
COMMENT ON COLUMN users.referral_code IS 'Unique referral code for practitioner signup links';
COMMENT ON COLUMN users.practitioner_status IS 'Practitioner availability status';


-- ============================================================================
-- STEP 2: CREATE PATIENT_ASSIGNMENTS TABLE
-- ============================================================================
-- Tracks which practitioner is assigned to which patient

CREATE TABLE IF NOT EXISTS patient_assignments (
    -- Unique ID for each assignment
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- The patient (member)
    patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- The assigned practitioner
    practitioner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- When this assignment was created (when practitioner claimed patient)
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Private notes from practitioner (patient cannot see)
    practitioner_notes TEXT,

    -- Assignment status ('active', 'paused', 'completed')
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),

    -- Last time practitioner reviewed this patient
    last_reviewed_at TIMESTAMP WITH TIME ZONE,

    -- Ensure one patient can only have one active practitioner
    UNIQUE(patient_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_patient_assignments_patient ON patient_assignments(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_assignments_practitioner ON patient_assignments(practitioner_id);
CREATE INDEX IF NOT EXISTS idx_patient_assignments_status ON patient_assignments(status);

COMMENT ON TABLE patient_assignments IS 'Links practitioners to their assigned patients';
COMMENT ON COLUMN patient_assignments.practitioner_notes IS 'Private notes - patient cannot view';


-- ============================================================================
-- STEP 3: CREATE PRACTITIONER_ALERTS TABLE
-- ============================================================================
-- Stores alerts for practitioners about their patients

CREATE TABLE IF NOT EXISTS practitioner_alerts (
    -- Unique ID for each alert
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- The practitioner this alert is for
    practitioner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- The patient this alert is about
    patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Alert type: 'symptom_spike', 'no_login', 'unread_message', 'needs_review'
    alert_type TEXT NOT NULL CHECK (alert_type IN (
        'symptom_spike',
        'no_login',
        'unread_message',
        'needs_review'
    )),

    -- Alert priority: 'high', 'medium', 'low'
    priority TEXT NOT NULL CHECK (priority IN ('high', 'medium', 'low')),

    -- Alert title/summary
    title TEXT NOT NULL,

    -- Alert description
    description TEXT NOT NULL,

    -- When this alert was created
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- When this alert was resolved (NULL = unresolved)
    resolved_at TIMESTAMP WITH TIME ZONE,

    -- Who resolved it
    resolved_by UUID REFERENCES users(id),

    -- Additional metadata (e.g., tracking_log_id, message_id)
    metadata JSONB
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_alerts_practitioner ON practitioner_alerts(practitioner_id);
CREATE INDEX IF NOT EXISTS idx_alerts_patient ON practitioner_alerts(patient_id);
CREATE INDEX IF NOT EXISTS idx_alerts_unresolved ON practitioner_alerts(resolved_at) WHERE resolved_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_alerts_type ON practitioner_alerts(alert_type);

COMMENT ON TABLE practitioner_alerts IS 'Alerts for practitioners about patient needs';
COMMENT ON COLUMN practitioner_alerts.resolved_at IS 'NULL = unresolved, timestamp = resolved';


-- ============================================================================
-- STEP 4: CREATE CUSTOM_TRACKING_METRICS TABLE
-- ============================================================================
-- Allows practitioners to add custom tracking fields for specific patients

CREATE TABLE IF NOT EXISTS custom_tracking_metrics (
    -- Unique ID for each custom metric
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- The patient this custom metric is for
    patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- The practitioner who created this metric
    created_by_practitioner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Metric name (e.g., "PHGG Tolerance")
    metric_name TEXT NOT NULL,

    -- Metric type: 'scale', 'yes_no', 'number', 'text'
    metric_type TEXT NOT NULL CHECK (metric_type IN ('scale', 'yes_no', 'number', 'text')),

    -- For scale type: min value (e.g., 1)
    scale_min INTEGER,

    -- For scale type: max value (e.g., 10)
    scale_max INTEGER,

    -- Frequency: 'daily', 'weekly', 'as_needed'
    frequency TEXT DEFAULT 'daily' CHECK (frequency IN ('daily', 'weekly', 'as_needed')),

    -- Description shown to patient
    description TEXT,

    -- Whether this metric is currently active
    is_active BOOLEAN DEFAULT TRUE,

    -- When this metric was created
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- When this metric was deactivated
    deactivated_at TIMESTAMP WITH TIME ZONE
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_custom_metrics_patient ON custom_tracking_metrics(patient_id);
CREATE INDEX IF NOT EXISTS idx_custom_metrics_active ON custom_tracking_metrics(is_active) WHERE is_active = TRUE;

COMMENT ON TABLE custom_tracking_metrics IS 'Custom tracking fields practitioners add for specific patients';
COMMENT ON COLUMN custom_tracking_metrics.is_active IS 'If false, metric no longer appears in patient tracking';


-- ============================================================================
-- STEP 5: UPDATE MESSAGES TABLE
-- ============================================================================
-- Add practitioner_id to messages to track which practitioner sent the message

ALTER TABLE messages ADD COLUMN IF NOT EXISTS practitioner_id UUID REFERENCES users(id);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_messages_practitioner ON messages(practitioner_id);

COMMENT ON COLUMN messages.practitioner_id IS 'Which practitioner sent this message (if sender_type is practitioner)';


-- ============================================================================
-- STEP 6: CREATE VIEW FOR UNASSIGNED PATIENTS
-- ============================================================================
-- Shows all patients who don't have a practitioner assigned yet

CREATE OR REPLACE VIEW unassigned_patients_view AS
SELECT
    u.id,
    u.email,
    u.name,
    u.protocol,
    u.protocol_name,
    u.primary_complaint,
    u.symptom_frequency,
    u.duration,
    u.diagnoses,
    u.treatments_tried,
    u.stress_connection,
    u.created_at,
    u.last_login_at,
    -- Count of unread messages from this patient
    (SELECT COUNT(*) FROM messages m
     WHERE m.user_id = u.id
     AND m.sender_type = 'member'
     AND m.read_at IS NULL) AS unread_message_count
FROM users u
WHERE u.role = 'member'
AND u.status IN ('trial', 'active')
AND NOT EXISTS (
    SELECT 1 FROM patient_assignments pa
    WHERE pa.patient_id = u.id
    AND pa.status = 'active'
)
ORDER BY u.created_at DESC;

COMMENT ON VIEW unassigned_patients_view IS 'All patients without an assigned practitioner';


-- ============================================================================
-- STEP 7: CREATE VIEW FOR PRACTITIONER PATIENT SUMMARY
-- ============================================================================
-- Shows all patients for a practitioner with key metrics

CREATE OR REPLACE VIEW practitioner_patient_summary AS
SELECT
    pa.practitioner_id,
    pa.patient_id,
    pa.assigned_at,
    pa.status AS assignment_status,
    pa.last_reviewed_at,
    u.name AS patient_name,
    u.email AS patient_email,
    u.protocol,
    u.protocol_name,
    u.last_login_at,
    u.status AS patient_status,
    -- Days in program (from assignment date)
    EXTRACT(DAY FROM NOW() - pa.assigned_at)::INTEGER AS days_in_program,
    -- Count of unread messages
    (SELECT COUNT(*) FROM messages m
     WHERE m.user_id = u.id
     AND m.sender_type = 'member'
     AND m.read_at IS NULL) AS unread_message_count,
    -- Tracking compliance (last 7 days)
    (SELECT COUNT(*) FROM tracking_logs tl
     WHERE tl.user_id = u.id
     AND tl.date >= CURRENT_DATE - INTERVAL '7 days') AS tracking_count_last_7_days,
    -- Last tracking entry date
    (SELECT MAX(date) FROM tracking_logs tl
     WHERE tl.user_id = u.id) AS last_tracking_date
FROM patient_assignments pa
JOIN users u ON pa.patient_id = u.id
WHERE pa.status = 'active'
ORDER BY unread_message_count DESC, u.last_login_at ASC;

COMMENT ON VIEW practitioner_patient_summary IS 'Summary of all patients for a practitioner with key metrics';


-- ============================================================================
-- STEP 8: CREATE FUNCTION TO CLAIM A PATIENT
-- ============================================================================
-- Allows a practitioner to claim an unassigned patient

CREATE OR REPLACE FUNCTION claim_patient(
    p_patient_id UUID,
    p_practitioner_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB;
    v_existing_assignment UUID;
    v_patient_name TEXT;
BEGIN
    -- Check if patient already has an active practitioner
    SELECT id INTO v_existing_assignment
    FROM patient_assignments
    WHERE patient_id = p_patient_id
    AND status = 'active';

    IF v_existing_assignment IS NOT NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Patient already has an assigned practitioner'
        );
    END IF;

    -- Create the assignment
    INSERT INTO patient_assignments (patient_id, practitioner_id)
    VALUES (p_patient_id, p_practitioner_id);

    -- Get patient name
    SELECT name INTO v_patient_name
    FROM users
    WHERE id = p_patient_id;

    RETURN jsonb_build_object(
        'success', true,
        'patient_name', v_patient_name,
        'message', 'Patient claimed successfully'
    );
END;
$$;

COMMENT ON FUNCTION claim_patient IS 'Allows a practitioner to claim an unassigned patient';


-- ============================================================================
-- STEP 9: CREATE FUNCTION TO CREATE ALERTS
-- ============================================================================
-- Helper function to create alerts

CREATE OR REPLACE FUNCTION create_practitioner_alert(
    p_practitioner_id UUID,
    p_patient_id UUID,
    p_alert_type TEXT,
    p_priority TEXT,
    p_title TEXT,
    p_description TEXT,
    p_metadata JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_alert_id UUID;
BEGIN
    INSERT INTO practitioner_alerts (
        practitioner_id,
        patient_id,
        alert_type,
        priority,
        title,
        description,
        metadata
    ) VALUES (
        p_practitioner_id,
        p_patient_id,
        p_alert_type,
        p_priority,
        p_title,
        p_description,
        p_metadata
    )
    RETURNING id INTO v_alert_id;

    RETURN v_alert_id;
END;
$$;

COMMENT ON FUNCTION create_practitioner_alert IS 'Creates a new alert for a practitioner';


-- ============================================================================
-- STEP 10: CREATE FUNCTION TO RESOLVE ALERTS
-- ============================================================================

CREATE OR REPLACE FUNCTION resolve_alert(
    p_alert_id UUID,
    p_resolved_by UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE practitioner_alerts
    SET
        resolved_at = NOW(),
        resolved_by = p_resolved_by
    WHERE id = p_alert_id
    AND resolved_at IS NULL;

    RETURN FOUND;
END;
$$;

COMMENT ON FUNCTION resolve_alert IS 'Marks an alert as resolved';


-- ============================================================================
-- STEP 11: CREATE RLS POLICIES FOR NEW TABLES
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE patient_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE practitioner_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_tracking_metrics ENABLE ROW LEVEL SECURITY;

-- Patient Assignments Policies
-- Practitioners can view their own patient assignments
CREATE POLICY "Practitioners can view own assignments"
    ON patient_assignments
    FOR SELECT
    USING (practitioner_id = auth.uid());

-- Practitioners can create assignments (claim patients)
CREATE POLICY "Practitioners can create assignments"
    ON patient_assignments
    FOR INSERT
    WITH CHECK (
        practitioner_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND role = 'practitioner'
        )
    );

-- Practitioners can update their own assignments
CREATE POLICY "Practitioners can update own assignments"
    ON patient_assignments
    FOR UPDATE
    USING (practitioner_id = auth.uid());

-- Patients can view their own assignment (to see who their practitioner is)
CREATE POLICY "Patients can view own assignment"
    ON patient_assignments
    FOR SELECT
    USING (patient_id = auth.uid());


-- Practitioner Alerts Policies
-- Practitioners can view their own alerts
CREATE POLICY "Practitioners can view own alerts"
    ON practitioner_alerts
    FOR SELECT
    USING (practitioner_id = auth.uid());

-- Practitioners can create alerts
CREATE POLICY "Practitioners can create alerts"
    ON practitioner_alerts
    FOR INSERT
    WITH CHECK (
        practitioner_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND role = 'practitioner'
        )
    );

-- Practitioners can update their own alerts
CREATE POLICY "Practitioners can update own alerts"
    ON practitioner_alerts
    FOR UPDATE
    USING (practitioner_id = auth.uid());


-- Custom Tracking Metrics Policies
-- Practitioners can view metrics for their patients
CREATE POLICY "Practitioners can view patient metrics"
    ON custom_tracking_metrics
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM patient_assignments pa
            WHERE pa.patient_id = custom_tracking_metrics.patient_id
            AND pa.practitioner_id = auth.uid()
            AND pa.status = 'active'
        )
    );

-- Practitioners can create metrics for their patients
CREATE POLICY "Practitioners can create patient metrics"
    ON custom_tracking_metrics
    FOR INSERT
    WITH CHECK (
        created_by_practitioner_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM patient_assignments pa
            WHERE pa.patient_id = custom_tracking_metrics.patient_id
            AND pa.practitioner_id = auth.uid()
            AND pa.status = 'active'
        )
    );

-- Practitioners can update metrics for their patients
CREATE POLICY "Practitioners can update patient metrics"
    ON custom_tracking_metrics
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM patient_assignments pa
            WHERE pa.patient_id = custom_tracking_metrics.patient_id
            AND pa.practitioner_id = auth.uid()
            AND pa.status = 'active'
        )
    );

-- Patients can view their own custom metrics
CREATE POLICY "Patients can view own custom metrics"
    ON custom_tracking_metrics
    FOR SELECT
    USING (patient_id = auth.uid() AND is_active = TRUE);


-- ============================================================================
-- STEP 12: CREATE FUNCTION TO AUTO-GENERATE ALERTS
-- ============================================================================
-- This function checks for conditions that should trigger alerts
-- Call this periodically (e.g., via a cron job or when tracking is submitted)

CREATE OR REPLACE FUNCTION check_and_create_alerts()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_alert_count INTEGER := 0;
    v_patient RECORD;
    v_practitioner_id UUID;
BEGIN
    -- Check for patients with no login in 3+ days
    FOR v_patient IN
        SELECT pa.patient_id, pa.practitioner_id, u.name, u.last_login_at
        FROM patient_assignments pa
        JOIN users u ON pa.patient_id = u.id
        WHERE pa.status = 'active'
        AND u.last_login_at < NOW() - INTERVAL '3 days'
        AND NOT EXISTS (
            SELECT 1 FROM practitioner_alerts pa2
            WHERE pa2.patient_id = pa.patient_id
            AND pa2.alert_type = 'no_login'
            AND pa2.resolved_at IS NULL
        )
    LOOP
        PERFORM create_practitioner_alert(
            v_patient.practitioner_id,
            v_patient.patient_id,
            'no_login',
            'medium',
            'No Activity',
            v_patient.name || ' hasn''t logged in for ' ||
                EXTRACT(DAY FROM NOW() - v_patient.last_login_at)::INTEGER || ' days',
            jsonb_build_object('last_login', v_patient.last_login_at)
        );
        v_alert_count := v_alert_count + 1;
    END LOOP;

    -- Check for unread messages waiting 24+ hours
    FOR v_patient IN
        SELECT DISTINCT pa.patient_id, pa.practitioner_id, u.name, m.created_at
        FROM patient_assignments pa
        JOIN users u ON pa.patient_id = u.id
        JOIN messages m ON m.user_id = pa.patient_id
        WHERE pa.status = 'active'
        AND m.sender_type = 'member'
        AND m.read_at IS NULL
        AND m.created_at < NOW() - INTERVAL '24 hours'
        AND NOT EXISTS (
            SELECT 1 FROM practitioner_alerts pa2
            WHERE pa2.patient_id = pa.patient_id
            AND pa2.alert_type = 'unread_message'
            AND pa2.resolved_at IS NULL
        )
    LOOP
        PERFORM create_practitioner_alert(
            v_patient.practitioner_id,
            v_patient.patient_id,
            'unread_message',
            'medium',
            'Unread Message',
            'Message from ' || v_patient.name || ' waiting for response',
            jsonb_build_object('message_created_at', v_patient.created_at)
        );
        v_alert_count := v_alert_count + 1;
    END LOOP;

    RETURN v_alert_count;
END;
$$;

COMMENT ON FUNCTION check_and_create_alerts IS 'Auto-generates alerts based on patient activity';


-- ============================================================================
-- DONE!
-- ============================================================================
-- Your practitioner dashboard database is now set up!
--
-- NEXT STEPS:
--
-- 1. CREATE A TEST PRACTITIONER:
--    SELECT make_practitioner('your-email@gmail.com');
--
-- 2. ADD PRACTITIONER DETAILS:
--    UPDATE users
--    SET credentials = 'RNutr, Registered Clinical Nutritionist',
--        bio = 'Specializing in digestive health and gut restoration.',
--        specializations = ARRAY['bloating', 'post_sibo', 'gut_brain'],
--        referral_code = 'rebecca-gut',
--        practitioner_status = 'available'
--    WHERE email = 'your-email@gmail.com';
--
-- 3. VIEW UNASSIGNED PATIENTS:
--    SELECT * FROM unassigned_patients_view;
--
-- 4. CLAIM A PATIENT:
--    SELECT claim_patient('patient-uuid', 'practitioner-uuid');
--
-- 5. VIEW YOUR PATIENTS:
--    SELECT * FROM practitioner_patient_summary
--    WHERE practitioner_id = 'your-practitioner-uuid';
--
-- 6. CREATE AN ALERT:
--    SELECT create_practitioner_alert(
--        'practitioner-uuid',
--        'patient-uuid',
--        'symptom_spike',
--        'high',
--        'Symptom Spike',
--        'Patient reported significant symptoms',
--        '{"tracking_log_id": "log-uuid"}'::jsonb
--    );
--
-- ============================================================================
