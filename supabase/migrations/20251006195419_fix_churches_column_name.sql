/*
  # Fix Churches Column Name and Ensure RLS Policies

  1. Schema Changes
    - Rename `created_by` to `submitted_by` for consistency with application code
    - Update all foreign key constraints
    - Update all indexes

  2. Security Updates
    - Update all RLS policies to use `submitted_by` instead of `created_by`
    - Ensure admins can update all churches
    - Ensure users can only update their own submissions
    - Add policy to allow public read access to approved churches
*/

-- Rename the column if it exists as created_by
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'churches' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE churches RENAME COLUMN created_by TO submitted_by;
  END IF;
END $$;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read approved churches" ON churches;
DROP POLICY IF EXISTS "Users can read own submissions" ON churches;
DROP POLICY IF EXISTS "Users can insert churches" ON churches;
DROP POLICY IF EXISTS "Users can update own submissions" ON churches;
DROP POLICY IF EXISTS "Admins can read all churches" ON churches;
DROP POLICY IF EXISTS "Admins can update all churches" ON churches;
DROP POLICY IF EXISTS "Admins can delete churches" ON churches;

-- Recreate policies with correct column name

-- Public can read approved churches
CREATE POLICY "Public can read approved churches"
  ON churches
  FOR SELECT
  TO public
  USING (is_approved = true);

-- Authenticated users can read approved churches
CREATE POLICY "Authenticated users can read approved churches"
  ON churches
  FOR SELECT
  TO authenticated
  USING (is_approved = true);

-- Users can read their own submissions regardless of approval status
CREATE POLICY "Users can read own submissions"
  ON churches
  FOR SELECT
  TO authenticated
  USING (submitted_by = auth.uid());

-- Users can insert new churches
CREATE POLICY "Users can insert churches"
  ON churches
  FOR INSERT
  TO authenticated
  WITH CHECK (submitted_by = auth.uid());

-- Users can update ONLY their own submissions
CREATE POLICY "Users can update own submissions"
  ON churches
  FOR UPDATE
  TO authenticated
  USING (submitted_by = auth.uid())
  WITH CHECK (submitted_by = auth.uid());

-- Admins can read all churches
CREATE POLICY "Admins can read all churches"
  ON churches
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update ANY church (not restricted to their own)
CREATE POLICY "Admins can update any church"
  ON churches
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (true);

-- Admins can delete any church
CREATE POLICY "Admins can delete churches"
  ON churches
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Update index names if they exist
DROP INDEX IF EXISTS churches_created_by_idx;
CREATE INDEX IF NOT EXISTS churches_submitted_by_idx ON churches(submitted_by);