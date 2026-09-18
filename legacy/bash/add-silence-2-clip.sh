eval ffmpeg -f lavfi -i anullsrc=channel_layout=stereo:sample_rate=44100 -i thanks.mp4 -c:v copy -c:a aac -shortest thanks1.mp4
