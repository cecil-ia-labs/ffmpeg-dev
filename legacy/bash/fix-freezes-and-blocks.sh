ffmpeg -fflags +genpts -i source-code-reference.mp4 \
-map 0:v:0 -map 0:a? \
-vf "fps=30,setpts=N/(30*TB)" \
-af "aresample=async=1:first_pts=0" \
-c:v libx264 -crf 18 -preset medium \
-c:a aac -b:a 192k \
-movflags +faststart \
source-code-reference.cfr30.mp4