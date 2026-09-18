#!/bin/bash
directory="/home/juninho/Documents/bkpssd-images/convert"


# Percorre todos os arquivos .webp no diretório

for webp_file in "$directory"/*.webp; do

    # Verifica se o arquivo .webp realmente existe (para evitar erros em diretórios vazios)

    if [ -e "$webp_file" ]; then

        # Define o novo nome de arquivo .png

        png_file="${webp_file%.webp}.png"

        # Converte o arquivo usando ffmpeg

        ffmpeg -i "$webp_file" "$png_file"

    fi

done
