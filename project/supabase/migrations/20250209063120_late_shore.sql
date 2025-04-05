/*
  # Update officers table and data

  1. Changes
    - Safely handles existing policy
    - Adds new officers data
    - Updates case assignments

  2. Security
    - Maintains existing RLS settings
*/

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Anyone can read officers" ON officers;

-- Create or update the policy
CREATE POLICY "Anyone can read officers"
  ON officers
  FOR SELECT
  TO anon
  USING (true);

-- Insert additional officers if they don't exist
INSERT INTO officers (officer_id, name, rank, division, image_url)
SELECT d.*
FROM (VALUES
  ('DC 12345', 'Sarah Morgan', 'Detective Constable', 'Criminal Investigation', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'),
  ('PC 23456', 'James Wilson', 'Police Constable', 'Response Team', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'),
  ('DC 34567', 'Emily Chen', 'Detective Constable', 'Criminal Investigation', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'),
  ('PC 45678', 'Michael Brown', 'Police Constable', 'Community Policing', 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'),
  ('DS 56789', 'Rachel Thompson', 'Detective Sergeant', 'Criminal Investigation', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'),
  ('PC 67890', 'David Martinez', 'Police Constable', 'Response Team', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'),
  ('DC 78901', 'Lisa Patel', 'Detective Constable', 'Criminal Investigation', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'),
  ('PC 89012', 'John O''Connor', 'Police Constable', 'Traffic Division', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'),
  ('DS 90123', 'Amanda White', 'Detective Sergeant', 'Criminal Investigation', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'),
  ('PC 01234', 'Robert Kim', 'Police Constable', 'Community Policing', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80')
) AS d(officer_id, name, rank, division, image_url)
WHERE NOT EXISTS (
  SELECT 1 FROM officers WHERE officers.officer_id = d.officer_id
);

-- Ensure cases have assigned officers
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cases' AND column_name = 'assigned_officer_id'
  ) THEN
    UPDATE cases 
    SET assigned_officer_id = 'DC 12345' 
    WHERE assigned_officer_id IS NULL;
  END IF;
END $$;