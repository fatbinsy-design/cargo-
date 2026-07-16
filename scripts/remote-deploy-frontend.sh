#!/usr/bin/env bash
set -euo pipefail

IMAGE_NAME="${IMAGE_NAME:?IMAGE_NAME is required}"
IMAGE_TAG="${IMAGE_TAG:?IMAGE_TAG is required}"
FRONTEND_HOST_PORT="${FRONTEND_HOST_PORT:-8080}"
CONTAINER_NAME="${CONTAINER_NAME:-medishop-front}"
IMAGE="${IMAGE_NAME}:${IMAGE_TAG}"

previous_image="$(docker inspect "$CONTAINER_NAME" --format '{{.Config.Image}}' 2>/dev/null || true)"

docker pull "$IMAGE"
docker rm -f "$CONTAINER_NAME" >/dev/null 2>&1 || true
docker run -d \
  --name "$CONTAINER_NAME" \
  --restart unless-stopped \
  -p "127.0.0.1:${FRONTEND_HOST_PORT}:80" \
  "$IMAGE"

for attempt in $(seq 1 20); do
  if curl --fail --silent "http://127.0.0.1:${FRONTEND_HOST_PORT}/" >/dev/null; then
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
    -p "127.0.0.1:${FRONTEND_HOST_PORT}:80" \
    "$previous_image"
fi

exit 1
