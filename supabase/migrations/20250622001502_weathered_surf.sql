/*
  # Add Sunday Service Time to Churches

  1. Schema Changes
    - Add `sunday_service_time` column to churches table
    - Set default value for existing records
    - Update triggers and constraints

  2. Security
    - No RLS changes needed as existing policies cover new column
*/

-- Add sunday_service_time column to churches table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'churches' AND column_name = 'sunday_service_time'
  ) THEN
    ALTER TABLE churches ADD COLUMN sunday_service_time text DEFAULT '9:00 AM';
  END IF;
END $$;

-- Update existing records to have a default service time if null
UPDATE churches 
SET sunday_service_time = '9:00 AM' 
WHERE sunday_service_time IS NULL;