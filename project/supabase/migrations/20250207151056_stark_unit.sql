/*
  # Add case number to messages table

  1. Changes
    - Add case_number column to messages table
    - Make it optional (nullable) to maintain compatibility with existing messages
    
  2. Security
    - Maintain existing RLS policies
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'messages' AND column_name = 'case_number'
  ) THEN
    ALTER TABLE messages ADD COLUMN case_number text;
  END IF;
END $$;