#!/usr/bin/env bash
# يولّد الأفلام الأربعة: رسم الإطارات + الصوت + الدمج في videos/
# التشغيل: bash video/make.sh            (كل الأفلام)
#          bash video/make.sh rope       (فيلم واحد)
set -euo pipefail
cd "$(dirname "$0")/.."
declare -A NAMES=([musk]="01-حامل-المسك-ونافخ-الكير" [lantern]="02-الفانوس" [rope]="03-الحبل" [shadow]="04-الظل")
FILMS=("${@:-musk lantern rope shadow}")
FILMS=(${FILMS[@]})
mkdir -p videos build/video
for f in "${FILMS[@]}"; do node video/render.js "$f" & done; wait
python3 video/audio.py "${FILMS[@]}"
for f in "${FILMS[@]}"; do
  ffmpeg -y -loglevel error -i "build/video/$f.silent.mp4" -i "build/video/$f.wav" \
    -c:v copy -af "loudnorm=I=-16:TP=-1.5:LRA=11" -c:a aac -b:a 192k -ar 48000 -shortest -movflags +faststart \
    "videos/${NAMES[$f]}.mp4"
  echo "-> videos/${NAMES[$f]}.mp4"
done
