#!/bin/bash

# Navigate to the directory containing the .mp4 files
cd ./convert

# cd /home/juninhodeluca/Documentos/bkpssd-images/Gifs/temp

# Loop through all .mp4 files in the directory
for file in *.mp4; do
    # Get the filename without extension
    filename=$(basename -- "$file")
    filename_no_ext="${filename%.*}"

    # Convert the .mp4 file to animated WebM with infinite loop using ffmpeg
    ffmpeg -i "$file" "$filename_no_ext.webm"
done
