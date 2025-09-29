-- +goose Up
CREATE INDEX IF NOT EXISTS idx_core_audit_log_occurred_at ON core.audit_log (occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_core_audit_log_action ON core.audit_log (action);

-- +goose Down
DROP INDEX IF EXISTS idx_core_audit_log_action;
DROP INDEX IF EXISTS idx_core_audit_log_occurred_at;
