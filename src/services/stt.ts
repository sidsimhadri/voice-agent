import { createClient, LiveTranscriptionEvents } from '@deepgram/sdk';
import { recordAudio } from '../audio/capture';
import config from '../config';
import fs from 'fs';
import { processUserInputStream } from './llm';

/**
 * Starts live transcription using Deepgram.
 * @param onTranscript - Callback function to handle transcribed text
 */
export async function startLiveTranscription(
  onTranscript: (transcript: string) => void
) {
  const deepgram = createClient(config.deepgramApiKey);

  const connection = deepgram.listen.live({
    model: 'nova-2',
    language: 'en-US',
    smart_format: true,
    encoding: 'linear16',
    sample_rate: 16000,
  });

  const transcriptionFile = fs.createWriteStream('transcription.txt', { flags: 'a' });

  connection.on(LiveTranscriptionEvents.Open, () => {
    console.log('Connected to Deepgram for live transcription.');
    const audioStream = recordAudio();

    audioStream.on('data', (chunk: Buffer) => {
      try {
        connection.send(chunk);
      } catch (error) {
        console.error('Error sending chunk to Deepgram:', error);
      }
    });

    audioStream.on('end', () => {
      console.log('Audio stream ended.');
      connection.requestClose();
    });

    audioStream.on('error', (err: Error) => {
      console.error('Audio stream error:', err.message);
      connection.requestClose();
    });
  });

  connection.on(LiveTranscriptionEvents.Error, (err) => {
    console.error('Deepgram Error:', err);
  });

  connection.on(LiveTranscriptionEvents.Transcript, (data) => {
    const transcript = data.channel?.alternatives[0]?.transcript;
    if (transcript) {
      console.log('Transcription:', transcript);
      transcriptionFile.write(transcript + '\n');
      onTranscript(transcript);
    } else {
      console.log('No transcript in response');
    }
  });

  connection.on(LiveTranscriptionEvents.Close, () => {
    console.log('Deepgram connection closed.');
    transcriptionFile.end();
  });
}
