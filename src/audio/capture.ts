import mic from 'mic';
import fs from 'fs';
import wav from 'wav';

export function recordAudio() {
  const micInstance = mic({
    rate: '16000', // 16 kHz sample rate
    channels: '1', // Mono
    bitwidth: '16', // 16-bit samples
    encoding: 'signed-integer', // PCM encoding
  });

  const audioStream = micInstance.getAudioStream();

  // Write audio to a file with proper WAV headers
  const fileStream = fs.createWriteStream('sample.wav');
  const wavWriter = new wav.Writer({
    sampleRate: 16000,
    channels: 1,
  });

  audioStream.pipe(wavWriter).pipe(fileStream);

  micInstance.start();
  console.log('Recording started...');

  audioStream.on('error', (err) => {
    console.error('Audio stream error:', err.message);
  });

  return audioStream;
}
