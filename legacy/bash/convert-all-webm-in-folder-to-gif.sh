#!/bin/bash

# Navigate to the directory containing the .mp4 files
cd /home/juninhodeluca/Documentos/bkpssd-images/Gifs/temp

# Loop through all .webm files in the directory
for file in *.webm; do
    # Get the filename without extension
    filename=$(basename -- "$file")
    filename_no_ext="${filename%.*}"

    ffmpeg -y -i "$file" -vf palettegen "palette_$filename_no_ext.png"
    #Convert the .webm file to GIF using ffmpeg
    #ffmpeg -i "$file" -loop 0 -r 10 -vf "fps=15,scale=in_w:in_h" -pix_fmt rgb24 "$filename_no_ext.gif"
    #ffmpeg -i "$file" -pix_fmt rgb24 "$filename_no_ext.gif"
    ffmpeg -y -i "$file" -i "palette_$filename_no_ext.png" -filter_complex paletteuse -r 10 "$filename_no_ext.gif"
    rm "palette_$filename_no_ext.png"

done
