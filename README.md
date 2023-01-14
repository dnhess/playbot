# README

This is a Discord bot that includes various moderation tools and commands specific to [Playbite](https://playbite.com/). The bot is built using [Discord.js](https://discord.js.org/) and [MongoDB](https://www.mongodb.com/).

![Logo](https://nft.playbite.com/ipfs/QmZ2QqHw4sGJPxkLQonojuTWTaRxgo32hgS31cpK5mZaQP)

## Running the Bot
1. Run `yarn install` to install all necessary dependencies.
2. Run `yarn dev` to start the bot.
3. To register the commands created, run `yarn deploy:commands`

## Environment Variables
The bot requires the following environment variables to be set:
- `DISCORD_TOKEN`: Discord API token used to authenticate the bot
- `CLIENT_ID`: Discord client ID for the bot
- `GUILD_ID`: (Optional) Guild ID for local development
- `BASE_API_URL`: Base URL for the API used by the bot
- `MONODB_URL`: URL for the MongoDB database used by the bot

Make sure to set these variables in a `.env` file or in your environment before running the bot.

## How to Contribute
1. Fork the repository and clone it to your local machine.
2. Create a new branch for your changes.
3. Make the necessary changes and test them thoroughly.
4. Commit your changes and push them to your fork.
5. Create a pull request to the main repository, describing the changes you made.
6. Wait for the changes to be reviewed and merged.

Please make sure to follow the existing code style and to add proper documentation for any new code.

If you have any questions or suggestions, please open an issue or contact the maintainers directly.
