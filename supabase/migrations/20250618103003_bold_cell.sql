/*
  # Create churches table

  1. New Tables
    - `churches`
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `address` (text, required)
      - `city` (text, required)
      - `state` (text, required)
      - `minister_name` (text, required)
      - `minister_phone` (text, optional)
      - `contact_phone` (text, required)
      - `photo_url` (text, optional)
      - `status` (text, default 'approved')
      - `created_by` (uuid, references user_profiles)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `churches` table
    - Add policies for authenticated users to read approved churches
    - Add policies for users to manage their own submissions
    - Add policies for admins to manage all churches

  3. Indexes
    - Add indexes for common search patterns
*/

CREATE TABLE IF NOT EXISTS churches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  minister_name text NOT NULL,
  minister_phone text,
  contact_phone text NOT NULL,
  photo_url text DEFAULT 'https://images.pexels.com/photos/8468689/pexels-photo-8468689.jpeg?auto=compress&cs=tinysrgb&w=400',
  status text NOT NULL DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_by uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE churches ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read approved churches
CREATE POLICY "Users can read approved churches"
  ON churches
  FOR SELECT
  TO authenticated
  USING (status = 'approved');

-- Users can read their own submissions regardless of status
CREATE POLICY "Users can read own submissions"
  ON churches
  FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());

-- Users can insert new churches
CREATE POLICY "Users can insert churches"
  ON churches
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

-- Users can update their own submissions
CREATE POLICY "Users can update own submissions"
  ON churches
  FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

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

-- Admins can update all churches
CREATE POLICY "Admins can update all churches"
  ON churches
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can delete churches
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

-- Indexes for performance
CREATE INDEX IF NOT EXISTS churches_status_idx ON churches(status);
CREATE INDEX IF NOT EXISTS churches_state_idx ON churches(state);
CREATE INDEX IF NOT EXISTS churches_city_idx ON churches(city);
CREATE INDEX IF NOT EXISTS churches_created_by_idx ON churches(created_by);
CREATE INDEX IF NOT EXISTS churches_name_idx ON churches USING gin(to_tsvector('english', name));

-- Trigger for updated_at
CREATE TRIGGER churches_updated_at
  BEFORE UPDATE ON churches
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();