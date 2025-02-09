/*
  # Recreate officers table with new data

  1. Changes
    - Update cases to remove old officer references
    - Drop and recreate officers table
    - Insert new officers
    - Update case assignments

  2. Security
    - Enable RLS
    - Add policy for public read access
*/

-- First update cases to remove old officer references
UPDATE cases SET assigned_officer_id = NULL;

-- Remove the foreign key constraint from cases
ALTER TABLE cases DROP CONSTRAINT IF EXISTS cases_assigned_officer_id_fkey;

-- Drop existing officers table and all its dependencies
DROP TABLE IF EXISTS officers CASCADE;

-- Create fresh officers table
CREATE TABLE officers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  officer_id text UNIQUE NOT NULL,
  name text NOT NULL,
  rank text NOT NULL,
  division text NOT NULL,
  status text DEFAULT 'Active',
  image_url text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE officers ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Anyone can read officers"
  ON officers
  FOR SELECT
  TO anon
  USING (true);

-- Add indexes for better performance
CREATE INDEX idx_officers_officer_id ON officers(officer_id);
CREATE INDEX idx_officers_rank ON officers(rank);

-- Insert 10 new officers with diverse roles and demographics
INSERT INTO officers (officer_id, name, rank, division, image_url) VALUES
  ('DC 54321', 'Elena Rodriguez', 'Detective Constable', 'Criminal Investigation', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'),
  ('DS 98765', 'Marcus Chen', 'Detective Sergeant', 'Major Crimes', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'),
  ('PC 24680', 'Aisha Patel', 'Police Constable', 'Community Policing', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'),
  ('DI 13579', 'Thomas Wright', 'Detective Inspector', 'Serious Crimes', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'),
  ('PC 11223', 'Sofia Nguyen', 'Police Constable', 'Response Team', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'),
  ('DS 44556', 'Jamal Hassan', 'Detective Sergeant', 'Cybercrime', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'),
  ('PC 77889', 'Isabella Santos', 'Police Constable', 'Traffic Division', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'),
  ('DC 99000', 'Raj Malhotra', 'Detective Constable', 'Financial Crimes', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'),
  ('DCI 12321', 'Sarah Morgan', 'Detective Chief Inspector', 'Criminal Investigation', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'),
  ('PC 45654', 'Liam O''Connor', 'Police Constable', 'Neighborhood Policing', 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80');

-- Re-add foreign key to cases table
ALTER TABLE cases ADD CONSTRAINT cases_assigned_officer_id_fkey 
  FOREIGN KEY (assigned_officer_id) REFERENCES officers(officer_id);

-- Update existing cases to be assigned to Sarah Morgan (DCI)
UPDATE cases SET assigned_officer_id = 'DCI 12321' WHERE assigned_officer_id IS NULL;