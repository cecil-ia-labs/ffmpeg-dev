#!/usr/bin/env bash

export LC_NUMERIC=C

DIR="${1:-.}"
OUTPUT="${2:-output.mp4}"

TRANSITION=1
FPS=30
WIDTH=1920
HEIGHT=1080

mapfile -t FILES < <(
  find "$DIR" -maxdepth 1 -type f -iname '*.mp4' -printf '%p\n' | sort
)

if (( ${#FILES[@]} < 2 )); then
  echo "São necessários pelo menos 2 vídeos."
  exit 1
fi

INPUTS=()
FILTER=""
declare -a DURATIONS

#
# Inputs e durações
#
for ((i=0; i<${#FILES[@]}; i++)); do
  INPUTS+=(-i "${FILES[$i]}")

  DURATIONS[$i]=$(
    ffprobe \
      -v error \
      -show_entries format=duration \
      -of default=noprint_wrappers=1:nokey=1 \
      "${FILES[$i]}"
  )
done

#
# Normaliza TODOS os vídeos antes do xfade
#
for ((i=0; i<${#FILES[@]}; i++)); do
  FILTER+="[${i}:v]"
  FILTER+="scale=${WIDTH}:${HEIGHT}:force_original_aspect_ratio=decrease,"
  FILTER+="pad=${WIDTH}:${HEIGHT}:(ow-iw)/2:(oh-ih)/2,"
  FILTER+="fps=${FPS},"
  FILTER+="format=yuv420p,"
  FILTER+="settb=AVTB,"
  FILTER+="setpts=PTS-STARTPTS"
  FILTER+="[video${i}];"
done

#
# Primeiro vídeo da cadeia
#
VIDEO="[video0]"
OFFSET=0

#
# Encadeia os xfades
#
for ((i=1; i<${#FILES[@]}; i++)); do
  PREV=$((i - 1))

  OFFSET=$(awk \
    -v offset="$OFFSET" \
    -v duration="${DURATIONS[$PREV]}" \
    -v transition="$TRANSITION" \
    'BEGIN {
      printf "%.6f", offset + duration - transition
    }'
  )

  VOUT="[v${i}]"

  FILTER+="${VIDEO}[video${i}]"
  FILTER+="xfade="
  FILTER+="transition=fade:"
  FILTER+="duration=${TRANSITION}:"
  FILTER+="offset=${OFFSET}"
  FILTER+="${VOUT};"

  VIDEO="$VOUT"
done

FILTER="${FILTER%;}"

ffmpeg \
  "${INPUTS[@]}" \
  -filter_complex "$FILTER" \
  -map "$VIDEO" \
  -an \
  -c:v libx264 \
  -preset medium \
  -crf 18 \
  -pix_fmt yuv420p \
  -r "$FPS" \
  -movflags +faststart \
  "$OUTPUT"