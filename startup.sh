#!/bin/sh
set -eu
cd /workspace

if [ -f /tmp/lichess.token ] && [ -f /tmp/liorin-field.mjs ]; then
  alive=0
  if [ -f /tmp/liorin-field.pid ]; then
    pid=$(cat /tmp/liorin-field.pid)
    if kill -0 "$pid" 2>/dev/null; then
      alive=1
    fi
  fi
  if [ "$alive" = 0 ]; then
    node --experimental-strip-types --no-warnings /tmp/liorin-field.mjs >>/tmp/liorin-field.log 2>&1 &
    echo $! >/tmp/liorin-field.pid
  fi
  watch_alive=0
  if [ -f /tmp/liorin-watch.pid ]; then
    wpid=$(cat /tmp/liorin-watch.pid)
    if kill -0 "$wpid" 2>/dev/null; then
      watch_alive=1
    fi
  fi
  if [ "$watch_alive" = 0 ] && [ -f /tmp/liorin-watch.sh ]; then
    sh /tmp/liorin-watch.sh >/tmp/liorin-watch.log 2>&1 &
    echo $! >/tmp/liorin-watch.pid
  fi
fi

node scripts/preview.mjs stop || true
if curl -sf -o /dev/null --max-time 2 http://127.0.0.1:8080/; then
  exit 0
fi
npm run dev >>/tmp/app-startup.log 2>&1 &
