ffmpeg \
	-f v4l2 \
		-framerate 15 -video_size 320x240 -i /dev/video0 \
	-f mpegts \
		-codec:v mpeg1video -s 320x240 -b:v 500k -bf 0 \
	http://localhost:8083/juninhotest-uuid
