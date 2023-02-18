import dotenv from 'dotenv';

dotenv.config();

const {
  CLIENT_ID,
  GUILD_ID = '',
  DISCORD_TOKEN,
  BASE_API_URL,
  MONODB_URL,
} = process.env;

// If any of the required environment variables are missing, throw an error
if (!CLIENT_ID || !DISCORD_TOKEN || !BASE_API_URL || !MONODB_URL) {
  if (!CLIENT_ID) {
    throw new Error('CLIENT_ID is missing from .env');
  }
  if (!DISCORD_TOKEN) {
    throw new Error('DISCORD_TOKEN is missing from .env');
  }
  if (!BASE_API_URL) {
    throw new Error('BASE_API_URL is missing from .env');
  }
  if (!MONODB_URL) {
    throw new Error('MONODB_URL is missing from .env');
  }
}

const config: Record<string, string> = {
  CLIENT_ID,
  GUILD_ID,
  DISCORD_TOKEN,
  BASE_API_URL,
  MONODB_URL,
};

export default config;
