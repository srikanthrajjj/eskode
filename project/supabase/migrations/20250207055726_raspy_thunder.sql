/*
  # Create messages table for real-time chat

  1. New Tables
    - `messages`
      - `id` (uuid, primary key)
      - `sender_id` (text, not null) - ID of the sender
      - `receiver_id` (text, not null) - ID of the receiver
      - `text` (text, not null) - Message content
      - `created_at` (timestamp with time zone, default now())
      - `read` (boolean, default false) - Message read status

  2. Security
    - Enable RLS on `messages` table
    - Add policies for authenticated users to read and insert messages
*/

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id text NOT NULL,
  receiver_id text NOT NULL,
  text text NOT NULL,
  created_at timestamptz DEFAULT now(),
  read boolean DEFAULT false
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Allow users to read messages where they are either the sender or receiver
CREATE POLICY "Users can read their own messages"
  ON messages
  FOR SELECT
  USING (
    auth.uid()::text = sender_id OR 
    auth.uid()::text = receiver_id
  );

-- Allow users to insert messages
CREATE POLICY "Users can insert messages"
  ON messages
  FOR INSERT
  WITH CHECK (auth.uid()::text = sender_id);