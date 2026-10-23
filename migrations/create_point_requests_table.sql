-- Create point_requests table for validation system
CREATE TABLE IF NOT EXISTS point_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Request details
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES point_categories(id) ON DELETE CASCADE,
  semester_id UUID REFERENCES semesters(id) ON DELETE SET NULL,
  recorder_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Request data
  points_value INTEGER NOT NULL,
  notes TEXT,
  
  -- Status: pending, approved, rejected
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  
  -- Approval details
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT
);

-- Create indexes for better performance
CREATE INDEX idx_point_requests_status ON point_requests(status);
CREATE INDEX idx_point_requests_student_id ON point_requests(student_id);
CREATE INDEX idx_point_requests_recorder_id ON point_requests(recorder_id);
CREATE INDEX idx_point_requests_created_at ON point_requests(created_at DESC);

-- Add RLS policies
ALTER TABLE point_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read their own requests
CREATE POLICY "Users can view own requests"
  ON point_requests FOR SELECT
  USING (auth.uid() = student_id OR auth.uid() = recorder_id);

-- Policy: Kesiswaan can view all requests
CREATE POLICY "Kesiswaan can view all requests"
  ON point_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'kesiswaan'
    )
  );

-- Policy: Guru and Kesiswaan can create requests
CREATE POLICY "Guru and Kesiswaan can create requests"
  ON point_requests FOR INSERT
  WITH CHECK (
    auth.uid() = recorder_id AND
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role IN ('guru', 'kesiswaan')
    )
  );

-- Policy: Only Kesiswaan can update (approve/reject) requests
CREATE POLICY "Only Kesiswaan can update requests"
  ON point_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'kesiswaan'
    )
  );
