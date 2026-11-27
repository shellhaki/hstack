#!/usr/bin/env bash
# Synthesizes a light, bouncy 46 s background loop locally with ffmpeg (no samples, no rights issues):
# a C–Am–F–G pad, a plucked arpeggio, a soft kick and off-beat hats, at 100 BPM.
set -euo pipefail
cd "$(dirname "$0")/.."
D=46
B=0.6   # one beat at 100 BPM
BAR=4.8 # two bars per chord
c="mod(floor(t/$BAR),4)"
f1="if(eq($c,0),261.63,if(eq($c,1),220,if(eq($c,2),174.61,196)))"
f2="if(eq($c,0),329.63,if(eq($c,1),261.63,if(eq($c,2),220,246.94)))"
f3="if(eq($c,0),392,if(eq($c,1),329.63,if(eq($c,2),261.63,293.66)))"
m="mod(t,$BAR)"
env="min(1,min($m/0.5,($BAR-$m)/0.3))"
pad="0.07*$env*(sin(2*PI*$f1*t)+sin(2*PI*$f2*t)+0.8*sin(2*PI*$f3*t)+0.5*sin(2*PI*$f1/2*t))"
# arpeggio on eighth notes: root, third, fifth, octave
step="mod(floor(t/($B/2)),4)"
af="if(eq($step,0),$f1*2,if(eq($step,1),$f2*2,if(eq($step,2),$f3*2,$f1*4)))"
arp="0.09*exp(-9*mod(t,$B/2))*sin(2*PI*$af*t)"
kb="mod(t,$B)"
kick="0.55*exp(-11*$kb)*sin(2*PI*(48+70*exp(-28*$kb))*$kb)"
ffmpeg -v error -y \
  -f lavfi -i "aevalsrc='$pad':d=$D:s=44100" \
  -f lavfi -i "aevalsrc='$arp':d=$D:s=44100" \
  -f lavfi -i "aevalsrc='$kick':d=$D:s=44100" \
  -f lavfi -i "anoisesrc=d=$D:c=white:a=0.25:r=44100" \
  -filter_complex "\
[0]lowpass=f=1800,aecho=0.6:0.5:180:0.25[pad];\
[1]aecho=0.7:0.6:300:0.3,highpass=f=300[arp];\
[2]lowpass=f=180[kick];\
[3]highpass=f=7000,volume='if(between(mod(t,$B),$B/2,$B/2+0.035),0.6,0)':eval=frame[hat];\
[pad][arp][kick][hat]amix=inputs=4:normalize=0,afade=t=in:d=1.2,afade=t=out:st=$((D-3)):d=3,alimiter=limit=0.8[out]" \
  -map "[out]" -ac 2 -b:a 192k public/music/background.mp3
ffmpeg -i public/music/background.mp3 -af volumedetect -f null - 2>&1 | grep -E "mean_volume|max_volume"
