-- ============================================================================
--  BulkSend — PostgreSQL Schema (Prisma-compatible DDL)
-- ============================================================================
--  Multi-tenant email campaign platform.
--
--  Design principles
--  -----------------
--  * Tenant isolation: every tenant-scoped table carries `workspace_id`, even
--    where it is technically derivable through a parent FK. This lets every
--    query filter on a single column, keeps composite indexes tenant-leading,
--    and makes Row-Level Security trivial.
--  * UUID primary keys (gen_random_uuid()) so IDs can be generated app-side,
--    are non-enumerable, and never collide across shards/regions.
--  * Every table has id / created_at / updated_at. `updated_at` is maintained
--    by a single trigger function rather than relying on the application.
--  * Native ENUM types for closed value sets.
--  * Deletes cascade from the workspace down so a tenant can be fully torn down
--    (GDPR erase). Contacts are SOFT-deleted (`deleted_at`) in normal operation
--    so send/event history is preserved for analytics.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS citext;     -- case-insensitive email / slug / name

-- ---------------------------------------------------------------------------
--  Shared trigger: keep updated_at honest regardless of the writing client
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------------
--  Enumerated types
-- ---------------------------------------------------------------------------
CREATE TYPE user_role       AS ENUM ('owner', 'admin', 'member');
CREATE TYPE contact_status  AS ENUM ('subscribed', 'unsubscribed', 'bounced', 'complained');
CREATE TYPE segment_type    AS ENUM ('dynamic', 'static');
CREATE TYPE campaign_status AS ENUM ('draft', 'scheduled', 'sending', 'sent', 'paused', 'cancelled');
CREATE TYPE send_status     AS ENUM ('pending', 'sent', 'failed', 'bounced');
CREATE TYPE event_type      AS ENUM ('opened', 'clicked', 'unsubscribed', 'bounced');


-- ============================================================================
--  workspaces
-- ============================================================================
CREATE TABLE workspaces (
    id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    name                 text        NOT NULL,
    slug                 citext      NOT NULL,
    plan                 text        NOT NULL DEFAULT 'free',
    send_rate_per_minute integer     NOT NULL DEFAULT 600 CHECK (send_rate_per_minute > 0),
    created_at           timestamptz NOT NULL DEFAULT now(),
    updated_at           timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX workspaces_slug_key ON workspaces (slug);
CREATE TRIGGER trg_workspaces_updated BEFORE UPDATE ON workspaces
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ============================================================================
--  users
-- ============================================================================
CREATE TABLE users (
    id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id  uuid        NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    email         citext      NOT NULL,
    name          text,
    role          user_role   NOT NULL DEFAULT 'member',
    password_hash text,
    last_login_at timestamptz,
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX users_workspace_email_key ON users (workspace_id, email);
CREATE TRIGGER trg_users_updated BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ============================================================================
--  contacts
-- ============================================================================
CREATE TABLE contacts (
    id               uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id     uuid           NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    email            citext         NOT NULL,
    first_name       text,
    last_name        text,
    status           contact_status NOT NULL DEFAULT 'subscribed',
    attributes       jsonb          NOT NULL DEFAULT '{}'::jsonb,
    unsubscribed_at  timestamptz,
    bounced_at       timestamptz,
    deleted_at       timestamptz,
    created_at       timestamptz    NOT NULL DEFAULT now(),
    updated_at       timestamptz    NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX contacts_workspace_email_key ON contacts (workspace_id, email);
CREATE INDEX contacts_workspace_status_idx ON contacts (workspace_id, status)
    WHERE deleted_at IS NULL;
CREATE INDEX contacts_attributes_gin ON contacts USING gin (attributes);
CREATE INDEX contacts_workspace_created_idx ON contacts (workspace_id, created_at DESC);
CREATE TRIGGER trg_contacts_updated BEFORE UPDATE ON contacts
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ============================================================================
--  tags
-- ============================================================================
CREATE TABLE tags (
    id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id uuid        NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name         citext      NOT NULL,
    color        text,
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX tags_workspace_name_key ON tags (workspace_id, name);
CREATE TRIGGER trg_tags_updated BEFORE UPDATE ON tags
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ============================================================================
--  contact_tags
-- ============================================================================
CREATE TABLE contact_tags (
    id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id uuid        NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    contact_id   uuid        NOT NULL REFERENCES contacts(id)   ON DELETE CASCADE,
    tag_id       uuid        NOT NULL REFERENCES tags(id)       ON DELETE CASCADE,
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX contact_tags_contact_tag_key ON contact_tags (contact_id, tag_id);
CREATE INDEX contact_tags_tag_idx ON contact_tags (tag_id);
CREATE TRIGGER trg_contact_tags_updated BEFORE UPDATE ON contact_tags
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ============================================================================
--  segments
-- ============================================================================
CREATE TABLE segments (
    id           uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id uuid         NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name         text         NOT NULL,
    description  text,
    type         segment_type NOT NULL DEFAULT 'dynamic',
    filter       jsonb        NOT NULL DEFAULT '{}'::jsonb,
    created_at   timestamptz  NOT NULL DEFAULT now(),
    updated_at   timestamptz  NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX segments_workspace_name_key ON segments (workspace_id, name);
CREATE TRIGGER trg_segments_updated BEFORE UPDATE ON segments
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ============================================================================
--  campaigns
-- ============================================================================
CREATE TABLE campaigns (
    id               uuid            PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id     uuid            NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    segment_id       uuid            REFERENCES segments(id) ON DELETE SET NULL,
    created_by       uuid            REFERENCES users(id)    ON DELETE SET NULL,
    name             text            NOT NULL,
    subject          text            NOT NULL,
    from_name        text            NOT NULL,
    from_email       citext          NOT NULL,
    reply_to         citext,
    body_html        text,
    body_text        text,
    status           campaign_status NOT NULL DEFAULT 'draft',
    scheduled_at     timestamptz,
    started_at       timestamptz,
    completed_at     timestamptz,
    recipient_count  integer         NOT NULL DEFAULT 0,
    sent_count       integer         NOT NULL DEFAULT 0,
    open_count       integer         NOT NULL DEFAULT 0,
    click_count      integer         NOT NULL DEFAULT 0,
    bounce_count     integer         NOT NULL DEFAULT 0,
    created_at       timestamptz     NOT NULL DEFAULT now(),
    updated_at       timestamptz     NOT NULL DEFAULT now()
);

CREATE INDEX campaigns_workspace_status_idx ON campaigns (workspace_id, status);
CREATE INDEX campaigns_due_idx ON campaigns (scheduled_at)
    WHERE status = 'scheduled';
CREATE TRIGGER trg_campaigns_updated BEFORE UPDATE ON campaigns
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ============================================================================
--  sends
-- ============================================================================
CREATE TABLE sends (
    id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id        uuid        NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    campaign_id         uuid        NOT NULL REFERENCES campaigns(id)  ON DELETE CASCADE,
    contact_id          uuid        NOT NULL REFERENCES contacts(id)   ON DELETE CASCADE,
    status              send_status NOT NULL DEFAULT 'pending',
    provider_message_id text,
    sent_at             timestamptz,
    failure_reason      text,
    created_at          timestamptz NOT NULL DEFAULT now(),
    updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX sends_campaign_contact_key ON sends (campaign_id, contact_id);
CREATE INDEX sends_campaign_status_idx ON sends (campaign_id, status);
CREATE UNIQUE INDEX sends_provider_message_id_key ON sends (provider_message_id)
    WHERE provider_message_id IS NOT NULL;
CREATE INDEX sends_contact_idx ON sends (contact_id);
CREATE TRIGGER trg_sends_updated BEFORE UPDATE ON sends
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ============================================================================
--  events
-- ============================================================================
CREATE TABLE events (
    id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id      uuid        NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    send_id           uuid        NOT NULL REFERENCES sends(id)      ON DELETE CASCADE,
    campaign_id       uuid        NOT NULL REFERENCES campaigns(id)  ON DELETE CASCADE,
    type              event_type  NOT NULL,
    metadata          jsonb       NOT NULL DEFAULT '{}'::jsonb,
    provider_event_id text,
    occurred_at       timestamptz NOT NULL,
    created_at        timestamptz NOT NULL DEFAULT now(),
    updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX events_provider_event_id_key ON events (provider_event_id)
    WHERE provider_event_id IS NOT NULL;
CREATE INDEX events_send_idx ON events (send_id);
CREATE INDEX events_campaign_type_time_idx ON events (campaign_id, type, occurred_at DESC);
CREATE INDEX events_workspace_time_idx ON events (workspace_id, occurred_at DESC);
CREATE INDEX events_metadata_gin ON events USING gin (metadata);
CREATE TRIGGER trg_events_updated BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ============================================================================
--  Row-Level Security template (enable per-table, then set `app.workspace_id`)
-- ============================================================================
--
--  ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
--  CREATE POLICY tenant_isolation ON contacts
--      USING (workspace_id = current_setting('app.workspace_id')::uuid);
--
--  Repeat for users, contacts, tags, contact_tags, segments, campaigns,
--  sends, and events.
-- ============================================================================
