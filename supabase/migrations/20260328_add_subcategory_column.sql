-- Add subcategory column to user_profiles
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS subcategory TEXT DEFAULT NULL;

-- Add subcategory column to complete_profiles
ALTER TABLE complete_profiles ADD COLUMN IF NOT EXISTS subcategory TEXT DEFAULT NULL;
