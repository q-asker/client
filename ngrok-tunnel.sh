#!/bin/bash

# 개발 서버(port 5175)를 ngrok으로 공개하는 스크립트

if ! command -v ngrok &> /dev/null; then
  echo "❌ ngrok이 설치되지 않았습니다."
  echo "설치: brew install ngrok (Mac)"
  exit 1
fi

echo "🚀 개발 서버 시작 및 ngrok 터널 오픈 (port 5175)"
echo ""

# npm run dev 실행 (백그라운드)
npm run dev -- --port 5175 &
DEV_PID=$!

# 서버 시작 대기 (2초)
sleep 2

# ngrok 터널 시작
echo "🌐 ngrok 터널 시작..."
ngrok http 5175

# ngrok 종료 시 dev 서버도 종료
kill $DEV_PID 2>/dev/null
