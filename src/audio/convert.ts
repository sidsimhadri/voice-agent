// import { WaveFile } from "wavefile";

// /**
//  * Converts a WAV audio buffer to 8kHz Mu-law format.
//  * @param audioBuffer - The buffer containing WAV data.
//  * @returns Buffer - The Mu-law converted audio buffer.
//  */
// export function convertAudioToMulaw(audioBuffer: Buffer): Buffer {
//   try {
//     if (audioBuffer.length < 44) {
//       throw new Error("Buffer too small to be a valid WAV file.");
//     }

//     const header = audioBuffer.slice(0, 4).toString("ascii");
//     const format = audioBuffer.slice(8, 12).toString("ascii");

//     if (header !== "RIFF" || format !== "WAVE") {
//       throw new Error('Invalid WAV header: Missing "RIFF" or "WAVE" identifiers.');
//     }

//     const wav = new WaveFile();
//     wav.fromBuffer(audioBuffer); // Parse the WAV buffer

//     wav.toSampleRate(8000, { method: "resample" }); // Resample to 8kHz
//     wav.toMuLaw(); // Convert to Mu-law format

//     return Buffer.from(wav.toBuffer());
//   } catch (error: any) {
//     console.error("Error during audio conversion:", error.message);
//     throw error;
//   }
// }
