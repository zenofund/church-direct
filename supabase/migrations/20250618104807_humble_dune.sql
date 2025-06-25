/*
  # Fix user signup trigger function

  1. Database Functions
    - Update `handle_new_user` function to properly create user profiles
    - Update `create_initial_admin` function to handle first admin creation
    
  2. Security
    - Ensure RLS policies allow user profile creation during signup
    - Add policy for service role to insert user profiles
    
  3. Triggers
    - Ensure trigger on auth.users table calls handle_new_user
    - Ensure trigger on user_profiles table calls create_initial_admin
*/

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS create_initial_admin() CASCADE;

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, role, status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'member',
    'approved'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to set first user as admin
CREATE OR REPLACE FUNCTION create_initial_admin()
RETURNS TRIGGER AS $$
DECLARE
  user_count INTEGER;
BEGIN
  -- Check if this is the first user
  SELECT COUNT(*) INTO user_count FROM public.user_profiles;
  
  -- If this is the first user, make them an admin
  IF user_count = 1 THEN
    NEW.role = 'admin';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users table to create profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Ensure the existing trigger on user_profiles is properly set up
DROP TRIGGER IF EXISTS create_initial_admin_trigger ON public.user_profiles;
CREATE TRIGGER create_initial_admin_trigger
  BEFORE INSERT ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION create_initial_admin();

-- Add RLS policy to allow service role to insert user profiles during signup
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_profiles' 
    AND policyname = 'Service role can insert profiles'
  ) THEN
    CREATE POLICY "Service role can insert profiles"
      ON public.user_profiles
      FOR INSERT
      TO service_role
      WITH CHECK (true);
  END IF;
END $$;

-- Ensure authenticated users can insert their own profile during signup
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_profiles' 
    AND policyname = 'Users can insert own profile'
  ) THEN
    CREATE POLICY "Users can insert own profile"
      ON public.user_profiles
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = id);
  END IF;
END $$;