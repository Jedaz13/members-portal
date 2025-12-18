-- Migration: Add protocol_history table to track protocol changes
-- Run this in Supabase SQL Editor

-- Create protocol_history table
CREATE TABLE IF NOT EXISTS protocol_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    practitioner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    previous_protocol INTEGER,
    new_protocol INTEGER NOT NULL,
    previous_stress_component BOOLEAN,
    new_stress_component BOOLEAN NOT NULL,
    changed_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT
);

-- Create index for faster queries by patient
CREATE INDEX IF NOT EXISTS idx_protocol_history_patient
ON protocol_history(patient_id, changed_at DESC);

-- Create index for faster queries by practitioner
CREATE INDEX IF NOT EXISTS idx_protocol_history_practitioner
ON protocol_history(practitioner_id, changed_at DESC);

-- Add RLS policies
ALTER TABLE protocol_history ENABLE ROW LEVEL SECURITY;

-- Practitioners can view protocol history for their patients
CREATE POLICY "Practitioners can view protocol history for their patients"
ON protocol_history FOR SELECT
TO authenticated
USING (
    practitioner_id = auth.uid() OR
    patient_id IN (
        SELECT patient_id FROM patient_assignments
        WHERE practitioner_id = auth.uid()
    )
);

-- Only practitioners can insert protocol history
CREATE POLICY "Practitioners can insert protocol history"
ON protocol_history FOR INSERT
TO authenticated
WITH CHECK (
    practitioner_id = auth.uid()
);

-- Comment for clarity
COMMENT ON TABLE protocol_history IS 'Tracks all protocol changes made by practitioners for audit and history purposes';
