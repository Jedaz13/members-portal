-- ============================================================================
-- FIX CLAIM PATIENT RPC PERMISSIONS
-- ============================================================================
-- This migration ensures the claim_patient function can be called by
-- authenticated users (practitioners) from the frontend.
--
-- Issue: Practitioners were getting a blank screen when clicking "Claim Patient"
-- because the RPC function wasn't properly accessible.
-- ============================================================================

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION claim_patient(UUID, UUID) TO authenticated;

-- Also grant to service_role for backend operations
GRANT EXECUTE ON FUNCTION claim_patient(UUID, UUID) TO service_role;

-- Ensure the function has proper security settings
-- Re-create with explicit search_path to prevent security issues
CREATE OR REPLACE FUNCTION claim_patient(
    p_patient_id UUID,
    p_practitioner_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
