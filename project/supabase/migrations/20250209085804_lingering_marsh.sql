/*
  # Add Tasks Table and Initial Data

  1. New Tables
    - `tasks`
      - `id` (uuid, primary key)
      - `crime_number` (text, references cases)
      - `summary` (text)
      - `offence` (text)
      - `officer_in_charge` (text)
      - `assigned_to` (text, references officers)
      - `completed` (boolean)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on tasks table
    - Add policies for public access (demo purposes)
*/

-- First ensure the cases exist
INSERT INTO cases (crime_number, victim_name, date_of_birth, address, type, type_color, officer_id)
SELECT d.*
FROM (VALUES
  ('CRI45678/25', 'JAMES WILSON', DATE '1990-01-01', '123 Main St', 'SEC 47 ASSAULT', 'bg-red-100 text-red-800', 'DC 12345'),
  ('CRI45679/25', 'SARAH SMITH', DATE '1985-02-15', '456 Oak Ave', 'BURGLARY OTD', 'bg-yellow-100 text-yellow-800', 'DC 12345'),
  ('CRI45680/25', 'MICHAEL BROWN', DATE '1992-03-20', '789 Pine Rd', 'ASSAULT WOUNDING', 'bg-orange-100 text-orange-800', 'DC 12345'),
  ('CRI45681/25', 'EMMA DAVIS', DATE '1988-04-10', '321 Elm St', 'ROBBERY', 'bg-purple-100 text-purple-800', 'DCI 12321'),
  ('CRI45682/25', 'JOHN TAYLOR', DATE '1995-05-05', '654 Maple Dr', 'BURGLARY OTD', 'bg-yellow-100 text-yellow-800', 'DS 44556'),
  ('CRI45683/25', 'LISA ANDERSON', DATE '1987-06-25', '987 Cedar Ln', 'SEC 47 ASSAULT', 'bg-red-100 text-red-800', 'DC 89123'),
  ('CRI45684/25', 'DAVID WILSON', DATE '1993-07-15', '147 Birch Ave', 'ROBBERY', 'bg-purple-100 text-purple-800', 'DS 44556'),
  ('CRI45685/25', 'ANNA MARTINEZ', DATE '1991-08-30', '258 Spruce St', 'BURGLARY OTD', 'bg-yellow-100 text-yellow-800', 'DC 54321'),
  ('CRI45686/25', 'ROBERT JOHNSON', DATE '1989-09-12', '369 Oak Rd', 'ASSAULT WOUNDING', 'bg-orange-100 text-orange-800', 'DI 78234'),
  ('CRI45687/25', 'SOPHIA LEE', DATE '1994-10-20', '741 Pine Ave', 'THEFT', 'bg-blue-100 text-blue-800', 'DC 99000'),
  ('CRI45688/25', 'WILLIAM CLARK', DATE '1986-11-05', '852 Maple St', 'ROBBERY', 'bg-purple-100 text-purple-800', 'DS 45678'),
  ('CRI45689/25', 'OLIVIA WHITE', DATE '1990-12-15', '963 Cedar Dr', 'SEC 47 ASSAULT', 'bg-red-100 text-red-800', 'DC 54321'),
  ('CRI45690/25', 'JAMES THOMAS', DATE '1988-01-25', '159 Birch Rd', 'BURGLARY OTD', 'bg-yellow-100 text-yellow-800', 'DCI 12321')
) AS d(crime_number, victim_name, date_of_birth, address, type, type_color, officer_id)
WHERE NOT EXISTS (
  SELECT 1 FROM cases WHERE cases.crime_number = d.crime_number
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  crime_number text NOT NULL REFERENCES cases(crime_number),
  summary text NOT NULL,
  offence text NOT NULL,
  officer_in_charge text NOT NULL,
  assigned_to text REFERENCES officers(officer_id),
  completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Create policies for demo purposes
CREATE POLICY "Anyone can read tasks"
  ON tasks
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anyone can update tasks"
  ON tasks
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can insert tasks"
  ON tasks
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Add indexes
CREATE INDEX idx_tasks_crime_number ON tasks(crime_number);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);

-- Insert initial task data
INSERT INTO tasks (crime_number, summary, offence, officer_in_charge, created_at) VALUES
  ('CRI45678/25', 'Obtain Statement from Witness', 'SEC 47 ASSAULT', 'DC 12345', '2025-02-08T10:00:00Z'),
  ('CRI45679/25', 'Review CCTV Footage', 'BURGLARY OTD', 'DC 12345', '2025-02-08T10:00:00Z'),
  ('CRI45680/25', 'Process DNA Evidence', 'ASSAULT WOUNDING', 'DC 12345', '2025-02-08T10:00:00Z'),
  ('CRI45681/25', 'Interview Key Suspect', 'ROBBERY', 'DCI 12321', '2025-02-08T10:00:00Z'),
  ('CRI45682/25', 'Collect Forensic Evidence', 'BURGLARY OTD', 'DS 44556', '2025-02-08T10:00:00Z'),
  ('CRI45683/25', 'Follow Up with Victim', 'SEC 47 ASSAULT', 'DC 89123', '2025-02-08T10:00:00Z'),
  ('CRI45684/25', 'Analyze Phone Records', 'ROBBERY', 'DS 44556', '2025-02-07T10:00:00Z'),
  ('CRI45685/25', 'Door-to-Door Inquiries', 'BURGLARY OTD', 'DC 54321', '2025-02-07T10:00:00Z'),
  ('CRI45686/25', 'Review Witness Statements', 'ASSAULT WOUNDING', 'DI 78234', '2025-02-07T10:00:00Z'),
  ('CRI45687/25', 'Check Local CCTV Coverage', 'THEFT', 'DC 99000', '2025-02-07T10:00:00Z'),
  ('CRI45688/25', 'Contact Local Businesses', 'ROBBERY', 'DS 45678', '2025-02-07T10:00:00Z'),
  ('CRI45689/25', 'Process Scene Photos', 'SEC 47 ASSAULT', 'DC 54321', '2025-02-07T10:00:00Z'),
  ('CRI45690/25', 'Update Case File', 'BURGLARY OTD', 'DCI 12321', '2025-02-07T10:00:00Z');