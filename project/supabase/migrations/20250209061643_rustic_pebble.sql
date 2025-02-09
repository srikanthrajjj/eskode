/*
  # Add Police Officers

  1. New Tables
    - `officers`
      - `id` (uuid, primary key)
      - `officer_id` (text, unique) - Badge/ID number
      - `name` (text) - Officer's name
      - `rank` (text) - Officer's rank (e.g., DC, PC)
      - `division` (text) - Officer's division/unit
      - `status` (text) - Current status (Active/Inactive)
      - `image_url` (text) - Officer's profile image URL
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `officers` table
    - Add policies for read access
*/

-- Create officers table
CREATE TABLE IF NOT EXISTS officers (
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

-- Create policies for demo purposes
CREATE POLICY "Anyone can read officers"
  ON officers
  FOR SELECT
  TO anon
  USING (true);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_officers_officer_id ON officers(officer_id);
CREATE INDEX IF NOT EXISTS idx_officers_rank ON officers(rank);

-- Insert initial officers
INSERT INTO officers (officer_id, name, rank, division, image_url) VALUES
  ('DC 12345', 'Sarah Morgan', 'Detective Constable', 'Criminal Investigation', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'),
  ('PC 23456', 'James Wilson', 'Police Constable', 'Response Team', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'),
  ('DC 34567', 'Emily Chen', 'Detective Constable', 'Criminal Investigation', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'),
  ('PC 45678', 'Michael Brown', 'Police Constable', 'Community Policing', 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'),
  ('DS 56789', 'Rachel Thompson', 'Detective Sergeant', 'Criminal Investigation', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'),
  ('PC 67890', 'David Martinez', 'Police Constable', 'Response Team', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'),
  ('DC 78901', 'Lisa Patel', 'Detective Constable', 'Criminal Investigation', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'),
  ('PC 89012', 'John O''Connor', 'Police Constable', 'Traffic Division', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'),
  ('DS 90123', 'Amanda White', 'Detective Sergeant', 'Criminal Investigation', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'),
  ('PC 01234', 'Robert Kim', 'Police Constable', 'Community Policing', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80');

-- Add foreign key to cases table
ALTER TABLE cases ADD COLUMN IF NOT EXISTS assigned_officer_id text REFERENCES officers(officer_id);
CREATE INDEX IF NOT EXISTS idx_cases_assigned_officer ON cases(assigned_officer_id);

-- Update existing cases to be assigned to DC Morgan
UPDATE cases SET assigned_officer_id = 'DC 12345' WHERE assigned_officer_id IS NULL;