-- 2dcite PostgreSQL Row Level Security
-- Apply: pnpm --filter @2dcite/db rls:apply
--
-- Session GUC (transaction-local via set_config is_local=true):
--   app.user_id    — authenticated User.id
--   app.user_role  — ATTORNEY | JUDGE | STUDENT | ADMIN
--   app.rls_bypass — 'on' only for trusted system paths
--
-- Unauthenticated / deny context uses user_id = '__none__' (no rows match).
-- FORCE ROW LEVEL SECURITY applies policies even to table owners.

BEGIN;

-- ---------------------------------------------------------------------------
-- Application role WITHOUT BYPASSRLS
-- Neon owner (neondb_owner) has rolbypassrls=true, so policies never fire
-- unless we SET LOCAL ROLE to a non-bypass role for each transaction.
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'twodcite_app') THEN
    CREATE ROLE twodcite_app NOLOGIN NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE;
  END IF;
  -- Best-effort; some hosts disallow ALTER ROLE
  BEGIN
    ALTER ROLE twodcite_app NOSUPERUSER NOBYPASSRLS;
  EXCEPTION WHEN insufficient_privilege OR OTHERS THEN
    NULL; -- keep existing role attributes
  END;
END $$;

GRANT USAGE ON SCHEMA public TO twodcite_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO twodcite_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO twodcite_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO twodcite_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO twodcite_app;

-- Connection user must be able to SET ROLE twodcite_app
GRANT twodcite_app TO CURRENT_USER;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION app_uid() RETURNS text
LANGUAGE sql STABLE AS $$
  SELECT NULLIF(current_setting('app.user_id', true), '');
$$;

CREATE OR REPLACE FUNCTION app_role() RETURNS text
LANGUAGE sql STABLE AS $$
  SELECT NULLIF(current_setting('app.user_role', true), '');
$$;

CREATE OR REPLACE FUNCTION app_bypass() RETURNS boolean
LANGUAGE sql STABLE AS $$
  SELECT COALESCE(current_setting('app.rls_bypass', true) = 'on', false);
$$;

/** True when a real authenticated user id is present (not empty / deny sentinel). */
CREATE OR REPLACE FUNCTION app_is_authenticated() RETURNS boolean
LANGUAGE sql STABLE AS $$
  SELECT app_uid() IS NOT NULL
    AND app_uid() <> ''
    AND app_uid() <> '__none__';
$$;

CREATE OR REPLACE FUNCTION app_is_admin() RETURNS boolean
LANGUAGE sql STABLE AS $$
  SELECT app_is_authenticated() AND app_role() = 'ADMIN';
$$;

CREATE OR REPLACE FUNCTION app_is_client() RETURNS boolean
LANGUAGE sql STABLE AS $$
  SELECT app_is_authenticated() AND app_role() IN ('ATTORNEY', 'JUDGE');
$$;

CREATE OR REPLACE FUNCTION app_is_student() RETURNS boolean
LANGUAGE sql STABLE AS $$
  SELECT app_is_authenticated() AND app_role() = 'STUDENT';
$$;

/** Self row on user-owned tables */
CREATE OR REPLACE FUNCTION app_is_self(owner_id text) RETURNS boolean
LANGUAGE sql STABLE AS $$
  SELECT app_is_authenticated() AND owner_id = app_uid();
$$;

/**
 * Job visibility / participation for authenticated users.
 * SECURITY DEFINER so nested Job checks are not re-filtered mid-policy evaluation.
 */
CREATE OR REPLACE FUNCTION app_can_access_job(jid text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT app_bypass()
    OR app_is_admin()
    OR (
      app_is_authenticated()
      AND EXISTS (
        SELECT 1 FROM "Job" j
        WHERE j.id = jid
          AND (j."clientId" = app_uid() OR j."studentId" = app_uid())
      )
    );
$$;

CREATE OR REPLACE FUNCTION app_is_job_client(jid text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT app_is_authenticated()
    AND EXISTS (
      SELECT 1 FROM "Job" j WHERE j.id = jid AND j."clientId" = app_uid()
    );
$$;

CREATE OR REPLACE FUNCTION app_is_job_student(jid text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT app_is_authenticated()
    AND EXISTS (
      SELECT 1 FROM "Job" j WHERE j.id = jid AND j."studentId" = app_uid()
    );
$$;

-- ---------------------------------------------------------------------------
-- Enable + FORCE RLS
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'User', 'Session', 'PasswordResetToken', 'StudentProfile', 'ClientProfile', 'Membership',
    'DeviceToken', 'Job', 'Review', 'Certificate', 'Payment', 'Payout',
    'LiabilityAcknowledgment', 'AuditLog'
  ]
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
  END LOOP;
END $$;

-- Drop prior 2dcite policies (idempotent)
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND policyname LIKE 'rls_%'
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON %I.%I',
      r.policyname, r.schemaname, r.tablename
    );
  END LOOP;
END $$;

-- ===========================================================================
-- User — authenticate as self; admin full; system bypass for register/login
-- ===========================================================================
CREATE POLICY rls_user_select ON "User"
  FOR SELECT
  USING (
    app_bypass()
    OR app_is_admin()
    OR (app_is_authenticated() AND id = app_uid())
  );

CREATE POLICY rls_user_insert ON "User"
  FOR INSERT
  WITH CHECK (
    app_bypass()
    OR app_is_admin()
    OR (app_is_authenticated() AND id = app_uid())
  );

CREATE POLICY rls_user_update ON "User"
  FOR UPDATE
  USING (
    app_bypass()
    OR app_is_admin()
    OR (app_is_authenticated() AND id = app_uid())
  )
  WITH CHECK (
    app_bypass()
    OR app_is_admin()
    OR (app_is_authenticated() AND id = app_uid())
  );

CREATE POLICY rls_user_delete ON "User"
  FOR DELETE
  USING (app_bypass() OR app_is_admin());

-- ===========================================================================
-- PasswordResetToken — system (bypass) only; never exposed to end users
-- ===========================================================================
CREATE POLICY rls_password_reset_select ON "PasswordResetToken"
  FOR SELECT USING (app_bypass() OR app_is_admin());
CREATE POLICY rls_password_reset_insert ON "PasswordResetToken"
  FOR INSERT WITH CHECK (app_bypass() OR app_is_admin());
CREATE POLICY rls_password_reset_update ON "PasswordResetToken"
  FOR UPDATE USING (app_bypass() OR app_is_admin())
  WITH CHECK (app_bypass() OR app_is_admin());
CREATE POLICY rls_password_reset_delete ON "PasswordResetToken"
  FOR DELETE USING (app_bypass() OR app_is_admin());

-- ===========================================================================
-- Session — only own sessions (auth system uses bypass)
-- ===========================================================================
CREATE POLICY rls_session_select ON "Session"
  FOR SELECT
  USING (
    app_bypass()
    OR app_is_admin()
    OR app_is_self("userId")
  );

CREATE POLICY rls_session_insert ON "Session"
  FOR INSERT
  WITH CHECK (
    app_bypass()
    OR app_is_admin()
    OR app_is_self("userId")
  );

CREATE POLICY rls_session_update ON "Session"
  FOR UPDATE
  USING (
    app_bypass()
    OR app_is_admin()
    OR app_is_self("userId")
  )
  WITH CHECK (
    app_bypass()
    OR app_is_admin()
    OR app_is_self("userId")
  );

CREATE POLICY rls_session_delete ON "Session"
  FOR DELETE
  USING (
    app_bypass()
    OR app_is_admin()
    OR app_is_self("userId")
  );

-- ===========================================================================
-- StudentProfile — self or admin
-- ===========================================================================
CREATE POLICY rls_student_profile_select ON "StudentProfile"
  FOR SELECT
  USING (app_bypass() OR app_is_admin() OR app_is_self("userId"));

CREATE POLICY rls_student_profile_insert ON "StudentProfile"
  FOR INSERT
  WITH CHECK (
    app_bypass()
    OR app_is_admin()
    OR (app_is_student() AND "userId" = app_uid())
  );

CREATE POLICY rls_student_profile_update ON "StudentProfile"
  FOR UPDATE
  USING (
    app_bypass()
    OR app_is_admin()
    OR (app_is_student() AND "userId" = app_uid())
  )
  WITH CHECK (
    app_bypass()
    OR app_is_admin()
    OR (app_is_student() AND "userId" = app_uid())
  );

CREATE POLICY rls_student_profile_delete ON "StudentProfile"
  FOR DELETE
  USING (app_bypass() OR app_is_admin());

-- ===========================================================================
-- ClientProfile — attorney/judge self or admin
-- ===========================================================================
CREATE POLICY rls_client_profile_select ON "ClientProfile"
  FOR SELECT
  USING (app_bypass() OR app_is_admin() OR app_is_self("userId"));

CREATE POLICY rls_client_profile_insert ON "ClientProfile"
  FOR INSERT
  WITH CHECK (
    app_bypass()
    OR app_is_admin()
    OR (app_is_client() AND "userId" = app_uid())
  );

CREATE POLICY rls_client_profile_update ON "ClientProfile"
  FOR UPDATE
  USING (
    app_bypass()
    OR app_is_admin()
    OR (app_is_client() AND "userId" = app_uid())
  )
  WITH CHECK (
    app_bypass()
    OR app_is_admin()
    OR (app_is_client() AND "userId" = app_uid())
  );

CREATE POLICY rls_client_profile_delete ON "ClientProfile"
  FOR DELETE
  USING (app_bypass() OR app_is_admin());

-- ===========================================================================
-- Membership — client self or admin / system
-- ===========================================================================
CREATE POLICY rls_membership_select ON "Membership"
  FOR SELECT
  USING (app_bypass() OR app_is_admin() OR app_is_self("userId"));

CREATE POLICY rls_membership_insert ON "Membership"
  FOR INSERT
  WITH CHECK (
    app_bypass()
    OR app_is_admin()
    OR (app_is_client() AND "userId" = app_uid())
  );

CREATE POLICY rls_membership_update ON "Membership"
  FOR UPDATE
  USING (
    app_bypass()
    OR app_is_admin()
    OR (app_is_client() AND "userId" = app_uid())
  )
  WITH CHECK (
    app_bypass()
    OR app_is_admin()
    OR (app_is_client() AND "userId" = app_uid())
  );

CREATE POLICY rls_membership_delete ON "Membership"
  FOR DELETE
  USING (app_bypass() OR app_is_admin());

-- ===========================================================================
-- DeviceToken — self only
-- ===========================================================================
CREATE POLICY rls_device_token_select ON "DeviceToken"
  FOR SELECT
  USING (app_bypass() OR app_is_admin() OR app_is_self("userId"));

CREATE POLICY rls_device_token_insert ON "DeviceToken"
  FOR INSERT
  WITH CHECK (
    app_bypass()
    OR app_is_admin()
    OR (app_is_authenticated() AND "userId" = app_uid())
  );

CREATE POLICY rls_device_token_update ON "DeviceToken"
  FOR UPDATE
  USING (
    app_bypass()
    OR app_is_admin()
    OR (app_is_authenticated() AND "userId" = app_uid())
  )
  WITH CHECK (
    app_bypass()
    OR app_is_admin()
    OR (app_is_authenticated() AND "userId" = app_uid())
  );

CREATE POLICY rls_device_token_delete ON "DeviceToken"
  FOR DELETE
  USING (
    app_bypass()
    OR app_is_admin()
    OR (app_is_authenticated() AND "userId" = app_uid())
  );

-- ===========================================================================
-- Job
-- SELECT: client, assigned student, admin
-- INSERT: client (as clientId) only
-- UPDATE: client or assigned student (or admin/system)
-- DELETE: admin/system only
-- ===========================================================================
CREATE POLICY rls_job_select ON "Job"
  FOR SELECT
  USING (
    app_bypass()
    OR app_is_admin()
    OR (app_is_authenticated() AND "clientId" = app_uid())
    OR (app_is_authenticated() AND "studentId" = app_uid())
  );

CREATE POLICY rls_job_insert ON "Job"
  FOR INSERT
  WITH CHECK (
    app_bypass()
    OR app_is_admin()
    OR (app_is_client() AND "clientId" = app_uid())
  );

CREATE POLICY rls_job_update ON "Job"
  FOR UPDATE
  USING (
    app_bypass()
    OR app_is_admin()
    OR (app_is_authenticated() AND "clientId" = app_uid())
    OR (app_is_authenticated() AND "studentId" = app_uid())
  )
  WITH CHECK (
    app_bypass()
    OR app_is_admin()
    OR (app_is_authenticated() AND "clientId" = app_uid())
    OR (app_is_authenticated() AND "studentId" = app_uid())
  );

CREATE POLICY rls_job_delete ON "Job"
  FOR DELETE
  USING (app_bypass() OR app_is_admin());

-- ===========================================================================
-- Review — read if job participant; write if assigned student
-- ===========================================================================
CREATE POLICY rls_review_select ON "Review"
  FOR SELECT
  USING (app_bypass() OR app_is_admin() OR app_can_access_job("jobId"));

CREATE POLICY rls_review_insert ON "Review"
  FOR INSERT
  WITH CHECK (
    app_bypass()
    OR app_is_admin()
    OR (app_is_student() AND app_is_job_student("jobId"))
  );

CREATE POLICY rls_review_update ON "Review"
  FOR UPDATE
  USING (
    app_bypass()
    OR app_is_admin()
    OR (app_is_student() AND app_is_job_student("jobId"))
  )
  WITH CHECK (
    app_bypass()
    OR app_is_admin()
    OR (app_is_student() AND app_is_job_student("jobId"))
  );

CREATE POLICY rls_review_delete ON "Review"
  FOR DELETE
  USING (app_bypass() OR app_is_admin());

-- ===========================================================================
-- Certificate — read if job participant; write system/admin only
-- ===========================================================================
CREATE POLICY rls_certificate_select ON "Certificate"
  FOR SELECT
  USING (app_bypass() OR app_is_admin() OR app_can_access_job("jobId"));

CREATE POLICY rls_certificate_insert ON "Certificate"
  FOR INSERT
  WITH CHECK (app_bypass() OR app_is_admin());

CREATE POLICY rls_certificate_update ON "Certificate"
  FOR UPDATE
  USING (app_bypass() OR app_is_admin())
  WITH CHECK (app_bypass() OR app_is_admin());

CREATE POLICY rls_certificate_delete ON "Certificate"
  FOR DELETE
  USING (app_bypass() OR app_is_admin());

-- ===========================================================================
-- Payment — client of job may read; write system/admin/client create
-- ===========================================================================
CREATE POLICY rls_payment_select ON "Payment"
  FOR SELECT
  USING (
    app_bypass()
    OR app_is_admin()
    OR app_is_job_client("jobId")
    OR app_is_job_student("jobId")
  );

CREATE POLICY rls_payment_insert ON "Payment"
  FOR INSERT
  WITH CHECK (
    app_bypass()
    OR app_is_admin()
    OR app_is_job_client("jobId")
  );

CREATE POLICY rls_payment_update ON "Payment"
  FOR UPDATE
  USING (
    app_bypass()
    OR app_is_admin()
    OR app_is_job_client("jobId")
  )
  WITH CHECK (
    app_bypass()
    OR app_is_admin()
    OR app_is_job_client("jobId")
  );

CREATE POLICY rls_payment_delete ON "Payment"
  FOR DELETE
  USING (app_bypass() OR app_is_admin());

-- ===========================================================================
-- Payout — student may read own share; write system/admin
-- ===========================================================================
CREATE POLICY rls_payout_select ON "Payout"
  FOR SELECT
  USING (
    app_bypass()
    OR app_is_admin()
    OR app_can_access_job("jobId")
    OR (app_is_authenticated() AND "studentId" = app_uid())
  );

CREATE POLICY rls_payout_insert ON "Payout"
  FOR INSERT
  WITH CHECK (app_bypass() OR app_is_admin());

CREATE POLICY rls_payout_update ON "Payout"
  FOR UPDATE
  USING (app_bypass() OR app_is_admin())
  WITH CHECK (app_bypass() OR app_is_admin());

CREATE POLICY rls_payout_delete ON "Payout"
  FOR DELETE
  USING (app_bypass() OR app_is_admin());

-- ===========================================================================
-- LiabilityAcknowledgment
-- ===========================================================================
CREATE POLICY rls_ack_select ON "LiabilityAcknowledgment"
  FOR SELECT
  USING (
    app_bypass()
    OR app_is_admin()
    OR app_is_self("userId")
    OR ("jobId" IS NOT NULL AND app_can_access_job("jobId"))
  );

CREATE POLICY rls_ack_insert ON "LiabilityAcknowledgment"
  FOR INSERT
  WITH CHECK (
    app_bypass()
    OR app_is_admin()
    OR (app_is_authenticated() AND "userId" = app_uid())
  );

CREATE POLICY rls_ack_update ON "LiabilityAcknowledgment"
  FOR UPDATE
  USING (
    app_bypass()
    OR app_is_admin()
    OR (app_is_authenticated() AND "userId" = app_uid())
  )
  WITH CHECK (
    app_bypass()
    OR app_is_admin()
    OR (app_is_authenticated() AND "userId" = app_uid())
  );

CREATE POLICY rls_ack_delete ON "LiabilityAcknowledgment"
  FOR DELETE
  USING (app_bypass() OR app_is_admin());

-- ===========================================================================
-- AuditLog — users read own actor rows; insert own; mutate admin/system only
-- ===========================================================================
CREATE POLICY rls_audit_select ON "AuditLog"
  FOR SELECT
  USING (
    app_bypass()
    OR app_is_admin()
    OR (app_is_authenticated() AND "actorId" = app_uid())
  );

CREATE POLICY rls_audit_insert ON "AuditLog"
  FOR INSERT
  WITH CHECK (
    app_bypass()
    OR app_is_admin()
    OR "actorId" IS NULL
    OR (app_is_authenticated() AND "actorId" = app_uid())
  );

CREATE POLICY rls_audit_update ON "AuditLog"
  FOR UPDATE
  USING (app_bypass() OR app_is_admin())
  WITH CHECK (app_bypass() OR app_is_admin());

CREATE POLICY rls_audit_delete ON "AuditLog"
  FOR DELETE
  USING (app_bypass() OR app_is_admin());

COMMIT;
