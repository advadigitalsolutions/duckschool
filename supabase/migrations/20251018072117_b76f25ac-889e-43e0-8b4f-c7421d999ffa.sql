-- Feature requests system tables
CREATE TABLE feature_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'planned', 'in_progress', 'completed', 'declined')),
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  category TEXT NOT NULL DEFAULT 'feature' CHECK (category IN ('feature', 'bug', 'improvement')),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE TABLE feature_request_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_request_id UUID REFERENCES feature_requests(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('up', 'down')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(feature_request_id, user_id)
);

CREATE TABLE feature_request_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_request_id UUID REFERENCES feature_requests(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  email_assignments BOOLEAN DEFAULT true,
  email_grades BOOLEAN DEFAULT true,
  email_reminders BOOLEAN DEFAULT true,
  email_weekly_summary BOOLEAN DEFAULT true,
  sms_enabled BOOLEAN DEFAULT false,
  push_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_feature_requests_status ON feature_requests(status);
CREATE INDEX idx_feature_requests_created_at ON feature_requests(created_at DESC);
CREATE INDEX idx_feature_request_votes_feature ON feature_request_votes(feature_request_id);
CREATE INDEX idx_feature_request_comments_feature ON feature_request_comments(feature_request_id);

-- RLS Policies
ALTER TABLE feature_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_request_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_request_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Feature requests policies
CREATE POLICY "Anyone can view feature requests"
  ON feature_requests FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create feature requests"
  ON feature_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can update feature requests"
  ON feature_requests FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role IN ('parent', 'admin')
    )
  );

-- Voting policies
CREATE POLICY "Anyone can view votes"
  ON feature_request_votes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage their own votes"
  ON feature_request_votes FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Comment policies
CREATE POLICY "Anyone can view comments"
  ON feature_request_comments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create comments"
  ON feature_request_comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
  ON feature_request_comments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Notification preferences policies
CREATE POLICY "Users can view their own notification preferences"
  ON notification_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification preferences"
  ON notification_preferences FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- View for vote counts
CREATE VIEW feature_request_vote_counts AS
SELECT 
  fr.id,
  COALESCE(SUM(CASE WHEN frv.vote_type = 'up' THEN 1 ELSE 0 END), 0) as upvotes,
  COALESCE(SUM(CASE WHEN frv.vote_type = 'down' THEN 1 ELSE 0 END), 0) as downvotes,
  COALESCE(SUM(CASE WHEN frv.vote_type = 'up' THEN 1 ELSE -1 END), 0) as net_votes
FROM feature_requests fr
LEFT JOIN feature_request_votes frv ON fr.id = frv.feature_request_id
GROUP BY fr.id;