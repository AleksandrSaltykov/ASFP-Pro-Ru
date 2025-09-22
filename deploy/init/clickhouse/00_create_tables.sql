CREATE DATABASE IF NOT EXISTS analytics;

CREATE TABLE IF NOT EXISTS analytics.events
(
    occurred_at DateTime64(3) DEFAULT now(),
    deal_id String,
    amount Float64,
    currency String,
    customer_id String,
    created_at DateTime
)
ENGINE = MergeTree
ORDER BY (occurred_at, deal_id);
