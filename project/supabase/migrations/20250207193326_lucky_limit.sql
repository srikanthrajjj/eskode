/*
  # Create cases table and add dummy data

  1. New Tables
    - `cases`
      - `id` (uuid, primary key)
      - `victim_name` (text)
      - `crime_number` (text, unique)
      - `date_of_birth` (date)
      - `address` (text)
      - `type` (text)
      - `type_color` (text)
      - `status` (text)
      - `officer_id` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `cases` table
    - Add policy for public access (for demo purposes)
*/

-- Create cases table
CREATE TABLE IF NOT EXISTS cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  victim_name text NOT NULL,
  crime_number text UNIQUE NOT NULL,
  date_of_birth date NOT NULL,
  address text NOT NULL,
  type text NOT NULL,
  type_color text NOT NULL,
  status text DEFAULT 'Ongoing',
  officer_id text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;

-- Create policy for demo purposes
CREATE POLICY "Anyone can read cases"
  ON cases
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anyone can insert cases"
  ON cases
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Insert dummy data
INSERT INTO cases (victim_name, crime_number, date_of_birth, address, type, type_color, officer_id) VALUES
  ('JAMES WILSON', 'CRI45678/21', '1982-03-15', '34 Oak Street, London E1 6AQ, UK', 'ASSAULT WOUNDING', 'bg-orange-100 text-orange-800', 'DC 12345'),
  ('MARIA GARCIA', 'CRI45679/21', '1995-07-22', '12 Maple Road, London SW1 8BH, UK', 'SEC 47 ASSAULT', 'bg-red-100 text-red-800', 'DC 12345'),
  ('DAVID BROWN', 'CRI45680/21', '1978-11-30', '89 Pine Lane, London NW3 5XY, UK', 'BURGLARY OTD', 'bg-yellow-100 text-yellow-800', 'DC 12345'),
  ('SARAH TAYLOR', 'CRI45681/21', '1990-04-18', '56 Elm Court, London SE15 3PQ, UK', 'ROBBERY', 'bg-purple-100 text-purple-800', 'DC 12345'),
  ('MICHAEL LEE', 'CRI45682/21', '1987-09-25', '23 Birch Avenue, London W1 4RS, UK', 'THEFT', 'bg-blue-100 text-blue-800', 'DC 12345'),
  ('EMMA DAVIES', 'CRI45683/21', '1993-01-12', '78 Cedar Close, London N1 7TU, UK', 'ASSAULT WOUNDING', 'bg-orange-100 text-orange-800', 'DC 12345'),
  ('JOHN MURPHY', 'CRI45684/21', '1975-06-08', '45 Willow Way, London E14 8HJ, UK', 'SEC 47 ASSAULT', 'bg-red-100 text-red-800', 'DC 12345'),
  ('SOPHIA PATEL', 'CRI45685/21', '1988-12-03', '91 Ash Road, London SW4 9KL, UK', 'BURGLARY OTD', 'bg-yellow-100 text-yellow-800', 'DC 12345'),
  ('ROBERT CHEN', 'CRI45686/21', '1984-08-20', '67 Beech Street, London NW6 2MN, UK', 'ROBBERY', 'bg-purple-100 text-purple-800', 'DC 12345'),
  ('LISA WONG', 'CRI45687/21', '1991-05-27', '12 Sycamore Lane, London SE1 4XP, UK', 'THEFT', 'bg-blue-100 text-blue-800', 'DC 12345');

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cases_crime_number ON cases(crime_number);
CREATE INDEX IF NOT EXISTS idx_cases_officer_id ON cases(officer_id);