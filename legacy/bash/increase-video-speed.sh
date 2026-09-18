#!/bin/bash

# Navigate to the directory containing the .mp4 files
cd ./convert

SPEED=2.5
EXTENSION=.mp4

# Loop through all .mp4 files in the directory
for file in *${EXTENSION}; do
    # Get the filename without extension
    filename=$(basename -- "$file")
    filename_no_ext="${filename%.*}"

    ffmpeg -i "$file" \
        -vf "setpts=PTS/$SPEED" \
        -an \
        -c:v libx264 \
        "${filename_no_ext}_${SPEED}x${EXTENSION}"

done


