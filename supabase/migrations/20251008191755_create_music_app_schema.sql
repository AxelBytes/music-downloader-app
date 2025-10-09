/*
  # Music Player Application Schema

  ## Overview
  This migration creates the complete database schema for a music streaming application
  with playlists, favorites, and user management.

  ## New Tables

  ### 1. `profiles`
  User profile information linked to auth.users
  - `id` (uuid, primary key) - References auth.users
  - `email` (text) - User email
  - `display_name` (text) - User display name
  - `avatar_url` (text, nullable) - Profile picture URL
  - `created_at` (timestamptz) - Account creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 2. `songs`
  Complete catalog of available songs
  - `id` (uuid, primary key) - Unique song identifier
  - `title` (text) - Song title
  - `artist` (text) - Artist name
  - `album` (text, nullable) - Album name
  - `duration` (integer) - Duration in seconds
  - `cover_url` (text) - Album/song cover image URL
  - `audio_url` (text) - Audio file URL
  - `created_at` (timestamptz) - When song was added

  ### 3. `playlists`
  User-created playlists
  - `id` (uuid, primary key) - Unique playlist identifier
  - `user_id` (uuid) - Owner of the playlist
  - `name` (text) - Playlist name
  - `description` (text, nullable) - Playlist description
  - `cover_url` (text, nullable) - Custom playlist cover
  - `is_favorite_playlist` (boolean) - Special flag for "Músicas que te gustan"
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last modification timestamp

  ### 4. `playlist_songs`
  Junction table linking playlists to songs
  - `id` (uuid, primary key) - Unique identifier
  - `playlist_id` (uuid) - Reference to playlist
  - `song_id` (uuid) - Reference to song
  - `position` (integer) - Song order in playlist
  - `added_at` (timestamptz) - When song was added to playlist

  ### 5. `user_favorites`
  Tracks which songs users have marked as favorites
  - `id` (uuid, primary key) - Unique identifier
  - `user_id` (uuid) - User who favorited the song
  - `song_id` (uuid) - Favorited song
  - `created_at` (timestamptz) - When song was favorited

  ## Security
  - Row Level Security (RLS) enabled on all tables
  - Users can only access their own data
  - Songs table is publicly readable but only admins can modify
  - Comprehensive policies for select, insert, update, and delete operations

  ## Important Notes
  1. The special "Músicas que te gustan" playlist is automatically created for each user
  2. When a song is favorited, it's automatically added to the favorite playlist
  3. All timestamps use timestamptz for proper timezone handling
  4. Foreign key constraints ensure data integrity
  5. Indexes are created for optimal query performance
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  display_name text NOT NULL,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create songs table
CREATE TABLE IF NOT EXISTS songs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  artist text NOT NULL,
  album text,
  duration integer NOT NULL DEFAULT 0,
  cover_url text NOT NULL,
  audio_url text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE songs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view songs"
  ON songs FOR SELECT
  TO authenticated
  USING (true);

-- Create playlists table
CREATE TABLE IF NOT EXISTS playlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  cover_url text,
  is_favorite_playlist boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own playlists"
  ON playlists FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own playlists"
  ON playlists FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own playlists"
  ON playlists FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own playlists"
  ON playlists FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id AND is_favorite_playlist = false);

-- Create playlist_songs junction table
CREATE TABLE IF NOT EXISTS playlist_songs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id uuid NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
  song_id uuid NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
  position integer NOT NULL DEFAULT 0,
  added_at timestamptz DEFAULT now(),
  UNIQUE(playlist_id, song_id)
);

ALTER TABLE playlist_songs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view songs in own playlists"
  ON playlist_songs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM playlists
      WHERE playlists.id = playlist_songs.playlist_id
      AND playlists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add songs to own playlists"
  ON playlist_songs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM playlists
      WHERE playlists.id = playlist_songs.playlist_id
      AND playlists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can remove songs from own playlists"
  ON playlist_songs FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM playlists
      WHERE playlists.id = playlist_songs.playlist_id
      AND playlists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update song positions in own playlists"
  ON playlist_songs FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM playlists
      WHERE playlists.id = playlist_songs.playlist_id
      AND playlists.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM playlists
      WHERE playlists.id = playlist_songs.playlist_id
      AND playlists.user_id = auth.uid()
    )
  );

-- Create user_favorites table
CREATE TABLE IF NOT EXISTS user_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  song_id uuid NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, song_id)
);

ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own favorites"
  ON user_favorites FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add own favorites"
  ON user_favorites FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own favorites"
  ON user_favorites FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_playlists_user_id ON playlists(user_id);
CREATE INDEX IF NOT EXISTS idx_playlist_songs_playlist_id ON playlist_songs(playlist_id);
CREATE INDEX IF NOT EXISTS idx_playlist_songs_song_id ON playlist_songs(song_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_song_id ON user_favorites(song_id);

-- Function to create favorite playlist for new users
CREATE OR REPLACE FUNCTION create_favorite_playlist_for_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO playlists (user_id, name, description, is_favorite_playlist)
  VALUES (
    NEW.id,
    'Músicas que te gustan',
    'Todas tus canciones favoritas en un solo lugar',
    true
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create favorite playlist
DROP TRIGGER IF EXISTS on_profile_created ON profiles;
CREATE TRIGGER on_profile_created
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_favorite_playlist_for_user();

-- Function to sync favorites with favorite playlist
CREATE OR REPLACE FUNCTION sync_favorite_to_playlist()
RETURNS TRIGGER AS $$
DECLARE
  favorite_playlist_id uuid;
  max_position integer;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Get the user's favorite playlist
    SELECT id INTO favorite_playlist_id
    FROM playlists
    WHERE user_id = NEW.user_id AND is_favorite_playlist = true
    LIMIT 1;
    
    IF favorite_playlist_id IS NOT NULL THEN
      -- Get max position in playlist
      SELECT COALESCE(MAX(position), -1) + 1 INTO max_position
      FROM playlist_songs
      WHERE playlist_id = favorite_playlist_id;
      
      -- Add song to favorite playlist
      INSERT INTO playlist_songs (playlist_id, song_id, position)
      VALUES (favorite_playlist_id, NEW.song_id, max_position)
      ON CONFLICT (playlist_id, song_id) DO NOTHING;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    -- Remove song from favorite playlist
    SELECT id INTO favorite_playlist_id
    FROM playlists
    WHERE user_id = OLD.user_id AND is_favorite_playlist = true
    LIMIT 1;
    
    IF favorite_playlist_id IS NOT NULL THEN
      DELETE FROM playlist_songs
      WHERE playlist_id = favorite_playlist_id AND song_id = OLD.song_id;
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to sync favorites with playlist
DROP TRIGGER IF EXISTS on_favorite_changed ON user_favorites;
CREATE TRIGGER on_favorite_changed
  AFTER INSERT OR DELETE ON user_favorites
  FOR EACH ROW
  EXECUTE FUNCTION sync_favorite_to_playlist();