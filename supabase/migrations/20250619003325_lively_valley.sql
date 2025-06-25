/*
  # Fix infinite recursion in user_profiles RLS policies

  1. Problem
    - Current admin policies query user_profiles table within the policy itself
    - This creates infinite recursion when trying to check if user is admin
    
  2. Solution
    - Drop existing problematic policies
    - Create new policies that don't cause recursion
    - Use a function-based approach for admin checks
    
  3. Changes
    - Remove recursive admin policies
    - Add new non-recursive admin policies
    - Maintain security while preventing infinite loops
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Admins can read all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON user_profiles;

-- Create a function to check if current user is admin (non-recursive)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM user_profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  );
$$;

-- Create new admin policies using the function
CREATE POLICY "Admins can read all profiles"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can update all profiles"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Also add a policy for admins to delete profiles if needed
CREATE POLICY "Admins can delete profiles"
  ON user_profiles
  FOR DELETE
  TO authenticated
  USING (is_admin());