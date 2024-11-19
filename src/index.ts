import { startLiveTranscription } from './services/stt';
import { processUserInputStream } from './services/llm';
import type { ChatCompletionMessage } from 'openai/resources/chat/completions';

// Add rate limiting
let lastProcessTime = 0;
const MIN_INTERVAL = 1000; // 1 second minimum between requests

(async () => {
  try {
    console.log('Starting live transcription...');
    await startLiveTranscription((transcript: string) => {
      const now = Date.now();
      if (now - lastProcessTime < MIN_INTERVAL) {
        return; // Skip if too soon
      }
      lastProcessTime = now;
      
      processUserInputStream(transcript)
        .then((response: ChatCompletionMessage) => {
          if (response.content) {
            console.log('Assistant:', response.content);
          }
          if (response.tool_calls && response.tool_calls.length > 0) {
            console.log('Processing action:', response.tool_calls[0].function.name);
          }
        })
        .catch(err => console.error('Error processing with LLM:', err));
    });
  } catch (err) {
    console.error('Error starting transcription:', err);
  }
})();
