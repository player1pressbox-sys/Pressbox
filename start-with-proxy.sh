#!/bin/bash
export HTTPS_PROXY=$(cat /tmp/quo_proxy_url.txt 2>/dev/null || echo "")
export NODE_TLS_REJECT_UNAUTHORIZED=0
cd /home/user/workspace/press-box
export NODE_ENV=production
exec node dist/index.cjs
