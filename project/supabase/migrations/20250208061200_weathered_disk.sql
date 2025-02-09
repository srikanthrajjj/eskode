-- Add update policy for notes
CREATE POLICY "Anyone can update notes"
  ON notes
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Add comment for documentation
COMMENT ON POLICY "Anyone can update notes" ON notes IS 'Allow anyone to update notes for demo purposes';