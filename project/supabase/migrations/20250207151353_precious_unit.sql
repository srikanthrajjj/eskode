/*
  # Update messages table indexes and policies

  1. Changes
    - Add indexes for better query performance
    - Add documentation for case_number column
    
  2. Security
    - Update RLS policies for case-specific messaging
*/

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_messages_case_number ON messages(case_number);
CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver ON messages(sender_id, receiver_id);

-- Add documentation for case_number column
COMMENT ON COLUMN messages.case_number IS 'Reference to the case number for case-specific messages';

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can read case messages" ON messages;
DROP POLICY IF EXISTS "Anyone can insert case messages" ON messages;

-- Create new policies
CREATE POLICY "Anyone can read case messages" ON messages FOR SELECT USING (true);
CREATE POLICY "Anyone can insert case messages" ON messages FOR INSERT WITH CHECK (true);