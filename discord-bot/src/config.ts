import dotenv from 'dotenv';

dotenv.config();

const {
  CLIENT_ID,
  GUILD_ID = '',
  DISCORD_TOKEN,
  BASE_API_URL,
  MONODB_URL,
  ROLLBAR_ACCESS_TOKEN,
} = process.env;

// If any of the required environment variables are missing, throw an error
if (
  !CLIENT_ID ||
  !DISCORD_TOKEN ||
  !BASE_API_URL ||
  !MONODB_URL ||
  !ROLLBAR_ACCESS_TOKEN
) {
  if (!CLIENT_ID) {
    console.log('CLIENT_ID is missing from .env');
  }
  if (!DISCORD_TOKEN) {
    console.log('DISCORD_TOKEN is missing from .env');
  }
  if (!BASE_API_URL) {
    console.log('BASE_API_URL is missing from .env');
  }
  if (!MONODB_URL) {
    console.log('MONODB_URL is missing from .env');
  }
  if (!ROLLBAR_ACCESS_TOKEN) {
    console.log('ROLLBAR_TOKEN is missing from .env');
  }
}

const config: Record<string, string | undefined> = {
  CLIENT_ID,
  GUILD_ID,
  DISCORD_TOKEN,
  BASE_API_URL,
  MONODB_URL,
  ROLLBAR_ACCESS_TOKEN,
};

export default config;
