# BulkSend — Local Dev Stack

Postgres 15 · Redis 7 · Kafka 3.8 (KRaft, no Zookeeper) · Redpanda Console.

## Prerequisites
- Docker Engine 24+ with the Compose v2 plugin (`docker compose`, not `docker-compose`).

## First-time setup
```bash
cp .env.example .env        # then edit credentials if you like
```

---

## 1. Start everything
```bash
docker compose up -d
```
Brings up all four services on the `bulksend_network`. Health checks gate the
order: Redpanda Console waits for Kafka to report healthy before it starts.

Watch them come up:
```bash
docker compose ps           # STATUS shows (healthy) once each is ready
docker compose logs -f      # tail all logs; Ctrl-C to stop tailing
```

Endpoints once healthy:
| Service          | Host address            |
|------------------|-------------------------|
| PostgreSQL       | `localhost:5432`        |
| Redis            | `localhost:6379`        |
| Kafka (broker)   | `localhost:9092`        |
| Kafka Console UI | http://localhost:8080   |

---

## 2. Reset all data cleanly
`down -v` removes the containers **and** the named volumes, so Postgres, Redis,
and the Kafka log all start empty next time.
```bash
docker compose down -v
docker compose up -d        # fresh stack
```

Reset just one service's data (example: Postgres):
```bash
docker compose rm -sf postgres
docker volume rm bulksend_postgres_data
docker compose up -d postgres
```

> ⚠️ `down -v` is destructive and irreversible — it wipes every BulkSend dev
> volume. Use plain `docker compose down` (no `-v`) to stop while keeping data.

---

## 3. Check if Kafka is ready

**Quick — Compose health status:**
```bash
docker compose ps kafka     # look for "(healthy)"
```

**Direct — ask the broker for its API versions** (exits non-zero if not ready):
```bash
docker compose exec kafka \
  /opt/kafka/bin/kafka-broker-api-versions.sh --bootstrap-server localhost:9092
```

**List topics** (proves the broker accepts client connections):
```bash
docker compose exec kafka \
  /opt/kafka/bin/kafka-topics.sh --bootstrap-server localhost:9092 --list
```

**Block in a script until Kafka is healthy:**
```bash
until [ "$(docker inspect -f '{{.State.Health.Status}}' bulksend-kafka)" = "healthy" ]; do
  echo "waiting for kafka..."; sleep 2;
done
echo "kafka is ready"
```

---

## Handy extras
```bash
# Create the BulkSend topics manually (auto-create is also on for dev)
docker compose exec kafka /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server localhost:9092 --create --if-not-exists \
  --topic campaign_jobs --partitions 6 --replication-factor 1

# Open a psql shell
docker compose exec postgres psql -U bulksend -d bulksend

# Open a redis-cli shell (authenticated)
docker compose exec redis redis-cli -a "$REDIS_PASSWORD"

# Stop without deleting data
docker compose down
```
