#!/usr/bin/env bash
# Breaks a reference video down so its techniques can be studied without copying it:
# a 1-frame-per-second contact sheet, the cut times, the loudness, and a spectrogram of the sound.
#   bash analyze-ref.sh <video> [out dir]      (default out dir: .hstack/motion/refs/<video name>)
set -euo pipefail
in="$1"; name=$(basename "${in%.*}")
out="${2:-.hstack/motion/refs/$name}"; mkdir -p "$out"
dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$in")
cols=6; rows=$(python3 -c "import math;print(max(1,math.ceil(float('$dur')/$cols)))")
ffmpeg -v error -y -i "$in" -vf "fps=1,scale=480:-2,tile=${cols}x${rows}" -frames:v 1 "$out/sheet.png"
# Hard cuts first; smooth films (dissolves, camera moves) need a lower threshold to show their beats.
for th in 0.25 0.12 0.06; do
  ffmpeg -v info -i "$in" -vf "select='gt(scene,$th)',showinfo" -f null - 2>&1 | grep -oE "pts_time:[0-9.]+" | cut -d: -f2 > "$out/cuts.txt" || true
  [ -s "$out/cuts.txt" ] && { echo "scene threshold: $th" > "$out/.threshold"; break; }
done
ffmpeg -v error -y -i "$in" -lavfi "showspectrumpic=s=1200x300:legend=0:scale=log" -frames:v 1 "$out/spectrum.png" 2>/dev/null || true
{ echo "duration: ${dur}s"; echo "cuts: $(wc -l < "$out/cuts.txt" | tr -d ' ') ($(tr '\n' ' ' < "$out/cuts.txt"))";
  ffmpeg -i "$in" -af volumedetect -vn -f null - 2>&1 | grep -oE "(mean|max)_volume: [-0-9.]+ dB"; } > "$out/summary.txt"
cat "$out/summary.txt"; echo "$out/sheet.png  $out/spectrum.png"
