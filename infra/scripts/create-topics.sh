#!/usr/bin/env bash
# Creates all BulkSend Kafka topics (idempotent — safe to re-run).
# Usage: KAFKA_BROKER=localhost:9092 ./create-topics.sh
set -euo pipefail

BROKER="${KAFKA_BROKER:-localhost:9092}"
KAFKA_CMD="${KAFKA_CMD:-/opt/kafka/bin/kafka-topics.sh}"

create() {
  local topic="$1" partitions="${2:-6}" replication="${3:-1}"
  if "$KAFKA_CMD" --bootstrap-server "$BROKER" --list | grep -qx "$topic"; then
    echo "  [skip] $topic already exists"
  else
    "$KAFKA_CMD" --bootstrap-server "$BROKER" \
      --create --topic "$topic" \
      --partitions "$partitions" \
      --replication-factor "$replication"
    echo "  [ok]   $topic"
  fi
}

echo "Creating BulkSend topics on $BROKER..."

# campaign.dispatch — campaign-level fan-out jobs (low volume, high priority)
create campaign.dispatch 6

# email.send — one message per recipient (high volume)
create email.send 24

# email.send.retry.t1 — retry tier 1 (~5s delay)
create email.send.retry.t1 6

# email.send.retry.t2 — retry tier 2 (~1m delay)
create email.send.retry.t2 6

# email.send.retry.t3 — retry tier 3 (~15m delay)
create email.send.retry.t3 6

# email.send.dlq — dead letter queue (exhausted retries / permanent errors)
create email.send.dlq 6

# email.events — SendGrid webhook events → DB
create email.events 12

echo "Done."
