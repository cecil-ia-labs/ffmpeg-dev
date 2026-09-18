#!/bin/bash

# Navigate to the directory containing the .mp4 files
cd ./convert
# Loop through all .mp4 files in the directory
ffmpeg -ss 40 -i demo.mp4 -c copy output.mp4
