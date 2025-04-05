/*
  # Remove 5 officers from the database

  1. Changes
    - Remove 5 officers from the officers table
    - Update any cases assigned to these officers to be assigned to DCI Sarah Morgan

  2. Officers to be removed:
    - Robert Kim (PC 01234)
    - John O'Connor (PC 89012)
    - David Martinez (PC 67890)
    - Michael Brown (PC 45678)
    - James Wilson (PC 23456)
*/

-- First, reassign any cases from these officers to DCI Sarah Morgan
UPDATE cases 
SET assigned_officer_id = 'DCI 12321'
WHERE assigned_officer_id IN (
  'PC 01234',
  'PC 89012',
  'PC 67890',
  'PC 45678',
  'PC 23456'
);

-- Then delete the officers
DELETE FROM officers
WHERE officer_id IN (
  'PC 01234',
  'PC 89012',
  'PC 67890',
  'PC 45678',
  'PC 23456'
);