#!/bin/bash

# Navigate to the directory containing the .mp4 files
cd ./convert
# Loop through all .mp4 files in the directory
for file in *.mp4; do
    # Get the filename without extension
    filename=$(basename -- "$file")
    filename_no_ext="${filename%.*}"

    ffmpeg -y \
          -i "$file" \
          -vf "bwdif=mode=send_frame:parity=auto:deint=interlaced,deblock=filter=strong:block=8:alpha=0.12:beta=0.07:gamma=0.06:delta=0.05,hqdn3d=2.4:1.8:4.0:3.0,nlmeans=s=2.4:p=7:r=15,scale=1280:720:force_original_aspect_ratio=increase:flags=lanczos,crop=1280:720,unsharp=3:3:0.18:3:3:0.0,setdar=16/9" \
          -c:v libx264 \
          -preset veryslow \
          -tune film \
          -crf 12 \
          -pix_fmt yuv420p \
          -x264-params "aq-mode=3:aq-strength=0.90:qcomp=0.70:psy-rd=0.85,0.12" \
          -c:a aac \
          -b:a 192k \
          -movflags +faststart \
          "$filename_no_ext"_1280x720_aggressive.mp4

done
