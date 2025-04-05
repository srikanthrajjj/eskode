/*
  # Create meetings table

  1. New Tables
    - `meetings`
      - `id` (uuid, primary key)
      - `case_number` (text, references cases)
      - `victim_name` (text)
      - `title` (text)
      - `date` (date)
      - `time` (text)
      - `location` (text)
      - `type` (text)
      - `type_color` (text)
      - `officer_id` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `meetings` table
    - Add policies for demo access
*/

-- Create meetings table
CREATE TABLE IF NOT EXISTS meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_number text REFERENCES cases(crime_number),
  victim_name text NOT NULL,
  title text NOT NULL,
  date date NOT NULL,
  time text NOT NULL,
  location text NOT NULL,
  type text NOT NULL,
  type_color text NOT NULL,
  officer_id text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;

-- Create policies for demo purposes
CREATE POLICY "Anyone can read meetings"
  ON meetings
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anyone can insert meetings"
  ON meetings
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_meetings_case_number ON meetings(case_number);
CREATE INDEX IF NOT EXISTS idx_meetings_officer_id ON meetings(officer_id);
CREATE INDEX IF NOT EXISTS idx_meetings_date ON meetings(date);