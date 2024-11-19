import dotenv from 'dotenv';

dotenv.config();

export default {
    deepgramApiKey: process.env.DEEPGRAM_API_KEY,
    togetherApiKey: process.env.TOGETHER_API_KEY,
    port: parseInt(process.env.PORT || '8080'),
}