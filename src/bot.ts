import { Client, Events, GatewayIntentBits } from 'discord.js';

import * as commandModules from './commands';
import config from './config';
import { messages } from './messages/messages';

const commands = Object(commandModules);

export const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once(Events.ClientReady, (c) => {
  console.log(`Ready! Logged in as ${c.user.tag}!`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  // if (!interaction.isCommand() || !interaction.isAutocomplete()) return;

  if (interaction.isChatInputCommand()) {
    console.log('IN HERE');
    const { commandName } = interaction;

    commands[commandName]?.execute(interaction, client);
  } else if (interaction.isAutocomplete()) {
    const { commandName } = interaction;
    console.log(`Command name: ${commandName}`);
    console.log(commands[commandName]);
    await commands[commandName]?.autocomplete(interaction, client);
  }
});

// On message create, check if the message matches given text
// TODO: Figure out how to make this work by storing the message in a db so I don't have to redeploy the bot every time I want to change the message
client.on(Events.MessageCreate, (message) => {
  // If bot sent the message, ignore it
  if (message.author.username === client?.user?.username) return;

  messages.forEach((msg) => {
    if (message.content.toLocaleLowerCase().includes(msg.message)) {
      message.reply(msg.response);
    }
  });
});

client.login(config.DISCORD_TOKEN);
