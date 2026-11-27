#!/usr/bin/env bash
# Synthesizes the sound effects locally with ffmpeg (no API key), into public/sfx/, and lists them in
# src/sfx.json so the video plays only the ones that exist.
set -euo pipefail
cd "$(dirname "$0")/.."
out=public/sfx
mk() { ffmpeg -v error -y -f lavfi -i "$2" -af "$3" -ar 44100 -ac 2 -b:a 160k "$out/$1.mp3"; }
# short pitched blips: sine with a fast exponential decay
mk tick    "sine=frequency=2200:duration=0.05"  "afade=t=out:st=0:d=0.05,volume=0.6"
mk click   "sine=frequency=1400:duration=0.04"  "afade=t=out:st=0:d=0.04,volume=0.7"
mk blip    "sine=frequency=880:duration=0.12"   "afade=t=in:d=0.005,afade=t=out:st=0.02:d=0.1"
mk pop     "sine=frequency=520:duration=0.14"   "asetrate=44100*1.6,aresample=44100,afade=t=out:st=0.01:d=0.12"
# two-note success chime
ffmpeg -v error -y -f lavfi -i "sine=frequency=988:duration=0.5" -f lavfi -i "sine=frequency=1319:duration=0.5" \
  -filter_complex "[0]afade=t=out:st=0.05:d=0.25,volume=0.6[a];[1]adelay=110|110,afade=t=out:st=0.15:d=0.35,volume=0.55[b];[a][b]amix=inputs=2:normalize=0" \
  -ar 44100 -ac 2 -b:a 160k "$out/success.mp3"
# glitch: a burst of bit-crushed noise
mk glitch  "anoisesrc=d=0.25:c=white:a=0.5"     "acrusher=bits=4:mode=log:aa=1,highpass=f=900,afade=t=out:st=0.05:d=0.2"
# impact: a low thump with a short noise tail
ffmpeg -v error -y -f lavfi -i "sine=frequency=55:duration=1.2" -f lavfi -i "anoisesrc=d=0.6:c=brown:a=0.6" \
  -filter_complex "[0]afade=t=out:st=0:d=1.1,volume=1.4[a];[1]lowpass=f=400,afade=t=out:st=0:d=0.6[b];[a][b]amix=inputs=2:normalize=0" \
  -ar 44100 -ac 2 -b:a 160k "$out/impact.mp3"
# whoosh and swipe: band-passed noise swelling in and out
mk whoosh  "anoisesrc=d=0.7:c=pink:a=0.7"      "bandpass=f=1200:w=900,afade=t=in:d=0.3,afade=t=out:st=0.3:d=0.4"
mk swipe   "anoisesrc=d=0.35:c=white:a=0.5"    "bandpass=f=3500:w=2500,afade=t=in:d=0.12,afade=t=out:st=0.12:d=0.23"
# typing: a dozen soft clicks
ffmpeg -v error -y -f lavfi -i "anoisesrc=d=1.2:c=white:a=0.6" \
  -af "highpass=f=2000,volume='if(lt(mod(t,0.085),0.012),1,0)':eval=frame,afade=t=out:st=1.0:d=0.2" -ar 44100 -ac 2 -b:a 160k "$out/typing.mp3"
# ratchet: fast ticks for counters and bars
ffmpeg -v error -y -f lavfi -i "sine=frequency=1800:duration=0.8" \
  -af "volume='if(lt(mod(t,0.04),0.006),1,0)':eval=frame,afade=t=out:st=0.6:d=0.2,volume=0.5" -ar 44100 -ac 2 -b:a 160k "$out/ratchet.mp3"
# data: chirps stepping through pitches
ffmpeg -v error -y -f lavfi -i "aevalsrc='0.35*sin(2*PI*t*(600+900*floor(mod(t*18,4))))':d=0.8" \
  -af "volume='if(lt(mod(t,0.055),0.035),1,0)':eval=frame,afade=t=out:st=0.6:d=0.2" -ar 44100 -ac 2 -b:a 160k "$out/data.mp3"
# shimmer: a rising soft sweep
mk shimmer "aevalsrc='0.25*sin(2*PI*(1500*t+1200*t*t))':d=0.9" "afade=t=in:d=0.2,afade=t=out:st=0.4:d=0.5"
ls "$out" | sed 's/\.mp3$//' | python3 -c 'import sys,json; print(json.dumps([l.strip() for l in sys.stdin if l.strip()], indent=2))' > src/sfx.json
echo "made: $(ls $out | wc -l | tr -d ' ') effects"
