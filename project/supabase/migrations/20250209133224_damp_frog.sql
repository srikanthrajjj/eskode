/*
  # Add status column to meetings table

  1. Changes
    - Add status column to meetings table with default value 'active'
    - Add index for better query performance
    - Update existing records to have default status
*/

-- Add status column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'meetings' AND column_name = 'status'
  ) THEN
    ALTER TABLE meetings ADD COLUMN status text DEFAULT 'active';
    CREATE INDEX idx_meetings_status ON meetings(status);
  END IF;
END $$;

-- Update any existing records to have the default status
UPDATE meetings SET status = 'active' WHERE status IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN meetings.status IS 'Status of the meeting (active/cancelled)';