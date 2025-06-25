/*
  # Create initial admin user

  1. Admin Setup
    - Creates a function to promote the first user to admin
    - This ensures there's always at least one admin user

  2. Security
    - Only runs if no admin users exist
    - Automatically promotes the first registered user
*/

-- Function to create initial admin user
CREATE OR REPLACE FUNCTION create_initial_admin()
RETURNS TRIGGER AS $$
BEGIN
  -- If this is the first user and no admins exist, make them admin
  IF NOT EXISTS (SELECT 1 FROM user_profiles WHERE role = 'admin') THEN
    NEW.role = 'admin';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically make first user an admin
CREATE TRIGGER create_initial_admin_trigger
  BEFORE INSERT ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_initial_admin();