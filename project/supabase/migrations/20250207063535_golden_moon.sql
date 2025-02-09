/*
  # Fix messages table RLS policies

  1. Changes
    - Update RLS policies to allow admin to send messages
    - Allow unauthenticated access for demo purposes
    - Add policy for inserting messages
    
  2. Security
    - Enable RLS on messages table
    - Add policies for reading and writing messages
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read their own messages" ON messages;
DROP POLICY IF EXISTS "Users can insert messages" ON messages;

-- Create new policies that allow access for demo purposes
CREATE POLICY "Anyone can read messages"
  ON messages
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anyone can insert messages"
  ON messages
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;