import dotenv from 'dotenv';

dotenv.config();

const { CLIENT_ID, GUILD_ID, DISCORD_TOKEN, BASE_API_URL } = process.env;

// If any of the required environment variables are missing, throw an error
if (!CLIENT_ID || !GUILD_ID || !DISCORD_TOKEN || !BASE_API_URL) {
  throw new Error('One or more environment variables are missing.');
}

const config: Record<string, string> = {
  CLIENT_ID,
  GUILD_ID,
  DISCORD_TOKEN,
  BASE_API_URL,
};

export default config;
