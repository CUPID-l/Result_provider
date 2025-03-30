/*
  # Initial Schema Setup for Student Results Portal

  1. New Tables
    - `classes`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `created_at` (timestamp)
      
    - `students`
      - `id` (uuid, primary key)
      - `admission_no` (text, unique)
      - `name` (text)
      - `class_id` (uuid, references classes)
      - `created_at` (timestamp)
      
    - `subjects`
      - `id` (uuid, primary key)
      - `name` (text)
      - `created_at` (timestamp)
      
    - `results`
      - `id` (uuid, primary key)
      - `student_id` (uuid, references students)
      - `subject_id` (uuid, references subjects)
      - `marks` (numeric)
      - `grade` (text)
      - `created_at` (timestamp)
      
    - `access_logs`
      - `id` (uuid, primary key)
      - `student_id` (uuid, references students)
      - `accessed_at` (timestamp)
      - `ip_address` (text)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users (admin) to manage all data
    - Add policies for public access to view results
*/

-- Create classes table
CREATE TABLE classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to classes"
  ON classes
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow authenticated users full access to classes"
  ON classes
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create students table
CREATE TABLE students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admission_no text UNIQUE NOT NULL,
  name text NOT NULL,
  class_id uuid REFERENCES classes(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to students"
  ON students
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow authenticated users full access to students"
  ON students
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create subjects table
CREATE TABLE subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to subjects"
  ON subjects
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow authenticated users full access to subjects"
  ON subjects
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create results table
CREATE TABLE results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  subject_id uuid REFERENCES subjects(id) ON DELETE CASCADE,
  marks numeric NOT NULL CHECK (marks >= 0 AND marks <= 100),
  grade text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to results"
  ON results
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow authenticated users full access to results"
  ON results
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create access logs table
CREATE TABLE access_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  accessed_at timestamptz DEFAULT now(),
  ip_address text
);

ALTER TABLE access_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users read access to access_logs"
  ON access_logs
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow public insert access to access_logs"
  ON access_logs
  FOR INSERT
  TO public
  WITH CHECK (true);