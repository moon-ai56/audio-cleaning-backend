# Audio Cleaning Backend

Simple backend for uploading an audio file and removing/muting bad words using FFmpeg.

## Routes
- GET / -> Health check
- POST /clean -> Upload audio + clean it

## Requirements
- Node 16+
- FFmpeg installed (Railway autoinstalls)
