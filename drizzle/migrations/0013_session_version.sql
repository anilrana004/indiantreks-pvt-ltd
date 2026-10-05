-- Session invalidation support: bump session_version on password reset to revoke cookies.
ALTER TABLE site_users
  ADD COLUMN IF NOT EXISTS session_version integer NOT NULL DEFAULT 0;
