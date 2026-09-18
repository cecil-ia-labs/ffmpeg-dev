#!/bin/bash

# Input and output files
base_path="/home/juninho/dev/chuvisco-ai/assets/ideias"
input_file="$base_path/3.mp3"
output_file="$base_path/3_cleaned.mp3"
silence_log="$base_path/silence_times.txt"
temp_list="$base_path/concat_list.txt"
trimmed_silences="$base_path/trimmed_silences.txt"

# log_file="/home/juninho/dev/chuvisco-ai/assets/ideias/1_silence_analysis.log"
touch "$silence_log"
touch "$temp_list"
touch "$trimmed_silences"

# Detect silence and extract timestamps
ffmpeg -i "$input_file" -af "silencedetect=noise=-30dB:d=0.5" -f null - 2> "$silence_log"

# Extract silence timestamps
awk '/silence_start/ {start=$NF} /silence_end/ {print start, $NF}' "$silence_log" > "$trimmed_silences"

# Generate ffmpeg trim commands
segments=()
prev_end=0

while read -r start end; do
    segments+=("-ss $prev_end -to $start -i $input_file")
    prev_end=$end
done < "$trimmed_silences"

# Ensure last segment is included
segments+=("-ss $prev_end -i $input_file")

# Process and concatenate segments
# rm -f $temp_list
for i in "${!segments[@]}"; do
    ffmpeg ${segments[$i]} -c copy "$base_path/segment_$i.wav"
    echo "file '$base_path/segment_$i.wav'" >> "$temp_list"
done

# Concatenate all valid segments
ffmpeg -f concat -safe 0 -i "$temp_list" -c copy "$output_file"

# Cleanup
# rm -f $base_path/segment_*.wav "$trimmed_silencest" "$temp_list"

echo "Processed file saved as: $output_file"
