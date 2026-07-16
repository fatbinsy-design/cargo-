#!/usr/bin/env bash
set -euo pipefail

IMAGE_NAME="${IMAGE_NAME:?IMAGE_NAME is required}"
IMAGE_TAG="${IMAGE_TAG:?IMAGE_TAG is required}"
DATABASE_URL="${DATABASE_URL:?DATABASE_URL is required}"
APP_PORT="${APP_PORT:-3000}"
SEED_DATABASE="${SEED_DATABASE:-false}"
CONTAINER_NAME="${CONTAINER_NAME:-medishop-back}"
IMAGE="${IMAGE_NAME}:${IMAGE_TAG}"

previous_image="$(docker inspect "$CONTAINER_NAME" --format '{{.Config.Image}}' 2>/dev/null || true)"

docker pull "$IMAGE"
docker run --rm -e "DATABASE_URL=$DATABASE_URL" "$IMAGE" npm run db:push

if [ "$SEED_DATABASE" = "true" ]; then
  docker run --rm -e "DATABASE_URL=$DATABASE_URL" "$IMAGE" npm run db:seed
fi

docker rm -f "$CONTAINER_NAME" >/dev/null 2>&1 || true
docker run -d \
  --name "$CONTAINER_NAME" \
  --restart unless-stopped \
  -p "${APP_PORT}:${APP_PORT}" \
  -e NODE_ENV=production \
  -e PORT="$APP_PORT" \
  -e "DATABASE_URL=$DATABASE_URL" \
  "$IMAGE"

for attempt in $(seq 1 30); do
  if curl --fail --silent "http://127.0.0.1:${APP_PORT}/health" >/dev/null; then
    docker image prune -f >/dev/null 2>&1 || true
    exit 0
  fi
  sleep 2
done

docker logs "$CONTAINER_NAME" || true
docker rm -f "$CONTAINER_NAME" >/dev/null 2>&1 || true

if [ -n "$previous_image" ]; then
  docker run -d \
    --name "$CONTAINER_NAME" \
    --restart unless-stopped \
    -p "${APP_PORT}:${APP_PORT}" \
    -e NODE_ENV=production \
    -e PORT="$APP_PORT" \
    -e "DATABASE_URL=$DATABASE_URL" \
    "$previous_image"
fi

exit 1
