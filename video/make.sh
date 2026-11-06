#!/usr/bin/env bash
# يولّد الأفلام الأربعة: رسم الإطارات + الصوت + الدمج.
# التشغيل: bash video/make.sh                 (النسخة الأفقية في videos/)
#          bash video/make.sh --reels         (النسخة العمودية للريلز بتسريع 1.3× في videos/reels/)
#          bash video/make.sh --reels rope    (فيلم واحد)
set -euo pipefail
cd "$(dirname "$0")/.."
REELS=0; SPEED=1.3
if [[ "${1:-}" == "--reels" ]]; then REELS=1; shift; fi
declare -A NAMES=([musk]="01-حامل-المسك-ونافخ-الكير" [lantern]="02-الفانوس" [rope]="03-الحبل" [shadow]="04-الظل")
FILMS=(${@:-musk lantern rope shadow})
mkdir -p videos/reels build/video
if (( REELS )); then
  for f in "${FILMS[@]}"; do node video/render.js "$f" --vertical --speed $SPEED & done; wait
else
  for f in "${FILMS[@]}"; do node video/render.js "$f" & done; wait
fi
python3 video/audio.py "${FILMS[@]}"
for f in "${FILMS[@]}"; do
  if (( REELS )); then
    in="build/video/$f.vertical.silent.mp4"; out="videos/reels/${NAMES[$f]}-ريلز.mp4"; af="atempo=$SPEED,"
  else
    in="build/video/$f.silent.mp4"; out="videos/${NAMES[$f]}.mp4"; af=""
  fi
  ffmpeg -y -loglevel error -i "$in" -i "build/video/$f.wav" \
    -c:v copy -af "${af}loudnorm=I=-14:TP=-1.5:LRA=11" -c:a aac -b:a 192k -ar 48000 -shortest -movflags +faststart "$out"
  echo "-> $out"
done
