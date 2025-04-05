/*
  # Add notes table for case management

  1. New Tables
    - `notes`
      - `id` (uuid, primary key)
      - `case_number` (text, references cases)
      - `text` (text)
      - `officer_id` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `notes` table
    - Add policies for demo access
*/

CREATE TABLE IF NOT EXISTS notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_number text REFERENCES cases(crime_number),
  text text NOT NULL,
  officer_id text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Create policies for demo purposes
CREATE POLICY "Anyone can read notes"
  ON notes
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anyone can insert notes"
  ON notes
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anyone can delete notes"
  ON notes
  FOR DELETE
  TO anon
  USING (true);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notes_case_number ON notes(case_number);
CREATE INDEX IF NOT EXISTS idx_notes_officer_id ON notes(officer_id);