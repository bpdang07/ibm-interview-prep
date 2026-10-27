#!/bin/bash
# Double-click this file in Finder to open your interview prep site and portfolio.
# Keep the Terminal window open while you study; close it to stop both sites.

PREP_DIR="$(cd "$(dirname "$0")" && pwd)"
PORTFOLIO_DIR="$HOME/Desktop/bpdang07_portfolio"

# Start each site unless something is already serving that port
if ! lsof -i :8081 >/dev/null 2>&1; then
  python3 -m http.server 8081 --directory "$PREP_DIR" >/dev/null 2>&1 &
  PREP_PID=$!
fi
if [ -d "$PORTFOLIO_DIR" ] && ! lsof -i :8080 >/dev/null 2>&1; then
  python3 -m http.server 8080 --directory "$PORTFOLIO_DIR" >/dev/null 2>&1 &
  PORTFOLIO_PID=$!
fi
trap 'kill $PREP_PID $PORTFOLIO_PID 2>/dev/null' EXIT

sleep 1
open "http://localhost:8081/"

echo ""
echo "  Interview prep:  http://localhost:8081"
echo "  Portfolio:       http://localhost:8080"
echo ""
echo "  Leave this window open while you study. Close it to stop."
wait
