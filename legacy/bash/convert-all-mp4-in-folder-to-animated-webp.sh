#!/bin/bash

# Navigate to the directory containing the .mp4 files
cd /home/juninhodeluca/Documentos/bkpssd-images/Gifs/temp

# Loop through all .mp4 files in the directory
for file in *.mp4; do
    # Get the filename without extension
    filename=$(basename -- "$file")
    filename_no_ext="${filename%.*}"

    # Convert the .mp4 file to a sequence of WebP images
    ffmpeg -i "$file" -vf "fps=10,scale=in_w:in_h" "${filename_no_ext}_%03d.webp"

    # Use webpmux to create an animated WebP file from the sequence
    webpmux -loop 0 -frame *.webp -o "$filename_no_ext.webp"

    # Remove the temporary WebP image sequence
    rm "${filename_no_ext}"_*.webp
done
