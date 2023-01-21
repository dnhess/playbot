import { track } from '@amplitude/analytics-node';
import fetch from 'cross-fetch';
import { Client, Events, GatewayIntentBits, InteractionType } from 'discord.js';
// Import mongoose
import mongoose from 'mongoose';

// eslint-disable-next-line import/no-cycle
import * as commandModules from './commands';
import config from './config';
import { buttonWelcomeDM } from './events/buttons/buttonWelcomeDM';
import { levelCheck } from './events/levelCheck';
import { channelCreateLog } from './events/logging/channelCreateLog';
import { channelDeleteLog } from './events/logging/channelDeleteLog';
import { memberBanLog } from './events/logging/memberBanLog';
import { memberRemoveLog } from './events/logging/memberRemoveLog';
import { memberUnbanLog } from './events/logging/memberUnbanLog';
import { messageDeleteLog } from './events/logging/messageDeleteLog';
import { messageUpdateLog } from './events/logging/messageUpdateLog';
import { modalWelcomeDM } from './events/modals/modalWelcomeDM';
import { sendJoinReaction } from './events/welcome/sendJoinReaction';
import { sendWelcome } from './events/welcome/sendWelcome';
import { sendWelcomeDM } from './events/welcome/sendWelcomeDM';
import { convertGameResponseToGameData } from './interfaces/IGame';
import { messages } from './messages/messages';

const commands = Object(commandModules);

export const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildBans,
    GatewayIntentBits.GuildEmojisAndStickers,
    GatewayIntentBits.GuildIntegrations,
    GatewayIntentBits.GuildWebhooks,
    GatewayIntentBits.GuildInvites,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildMessageTyping,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.DirectMessageReactions,
    GatewayIntentBits.DirectMessageTyping,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildScheduledEvents,
    GatewayIntentBits.AutoModerationConfiguration,
    GatewayIntentBits.AutoModerationExecution,
  ],
});

client.once(Events.ClientReady, async (c) => {
  console.log(`Ready! Logged in as ${c.user.tag}!`);

  const games = await fetch(`${config.BASE_API_URL}/feed?plat=web`);
  const gamesJson = await games.json();

  const gamesData = convertGameResponseToGameData(
    gamesJson.filter((game: { title: string }) => game.title === 'All')[0]
  );

  const choices: { name: string; value: string }[] = gamesData.map((game) => ({
    name: game.name,
    value: game.id,
  }));

  const initalRandomGame = choices[Math.floor(Math.random() * choices.length)];

  client.user?.setPresence({
    activities: [
      {
        name: initalRandomGame.name,
      },
    ],
  });

  setInterval(() => {
    // Pick a random game from choices
    const randomGame = choices[Math.floor(Math.random() * choices.length)];

    client.user?.setPresence({
      activities: [
        {
          name: randomGame.name,
        },
      ],
    });
    // Set the presence every hour
  }, 1000 * 60 * 60);

  // Mongo connection
  if (!config.MONODB_URL) {
    throw new Error('MongoDB URL is missing.');
  }

  // ts ignore
  // @ts-ignore
  await mongoose.connect(config.MONODB_URL, {
    keepAlive: true,
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  if (mongoose.connection.readyState === 1) {
    console.log('Connected to MongoDB');
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isChatInputCommand()) {
    const { commandName } = interaction;
    console.log(`Received chat input command interaction: ${commandName}`);
    const eventProperties = {
      commandName,
      userName: interaction.user.username,
      guildId: interaction.guildId,
      guildName: interaction.guild?.name,
    };

    track('Command Interaction', eventProperties, {
      user_id: interaction.user.id,
      time: Date.now(),
    });

    // Remove hyphens from command name
    const commandNameNoHyphens = commandName.replace(/-/g, '');
    commands[commandNameNoHyphens]?.execute(interaction, client);
  } else if (interaction.isAutocomplete()) {
    const { commandName } = interaction;
    console.log(`Received qutocomplete interaction: ${commandName}`);

    const eventProperties = {
      commandName,
      userName: interaction.user.username,
      guildId: interaction.guildId,
      guildName: interaction.guild?.name,
    };

    track('Command Autocomplete', eventProperties, {
      user_id: interaction.user.id,
      time: Date.now(),
    });

    // Remove hyphens from command name
    const commandNameNoHyphens = commandName.replace(/-/g, '');

    await commands[commandNameNoHyphens]?.autocomplete(interaction, client);
  } else if (interaction.isButton()) {
    const { customId } = interaction;
    console.log(`Received button interaction with the id: ${customId}`);

    const eventProperties = {
      guildId: interaction.guildId,
      customId,
      userName: interaction.user.username,
      guildName: interaction.guild?.name,
    };

    track('Button Interaction', eventProperties, {
      user_id: interaction.user.id,
      time: Date.now(),
    });

    if (customId.includes(`welcome-modal-btn`)) {
      buttonWelcomeDM(interaction);
    }
  } else if (interaction.type === InteractionType.ModalSubmit) {
    const { customId } = interaction;

    console.log(`Received modal interaction with the id: ${customId}`);

    const eventProperties = {
      customId,
      userName: interaction.user.username,
      guildId: interaction.guildId,
      guildName: interaction.guild?.name,
    };

    track('Modal Interaction', eventProperties, {
      user_id: interaction.user.id,
      time: Date.now(),
    });

    if (customId.includes(`welcome-modal`)) {
      modalWelcomeDM(interaction, client);
    }
  }
});

// On message create, check if the message matches given text
client.on(Events.MessageCreate, async (message) => {
  const { guild, author } = message;
  // If bot sent the message, ignore it
  if (
    message.author.username === client?.user?.username ||
    !guild ||
    author.bot
  )
    return;

  levelCheck(message);

  messages.forEach((msg) => {
    if (message.content.toLocaleLowerCase().includes(msg.message)) {
      if (typeof msg.response === 'function') {
        message.channel.send(
          msg.response ? msg.response(message) : 'No response'
        );
      } else {
        message.channel.send(msg.response);
      }
    }
  });
});

// On user join, send a message to welcome them, DM the user with a modal to ask for their username
client.on(Events.GuildMemberAdd, (member) => {
  sendWelcome(member);
  sendJoinReaction(member);
  sendWelcomeDM(member);
});

// MOD LOGS
client.on(Events.ChannelCreate, async (channel) => {
  channelCreateLog(channel);
});

client.on(Events.ChannelDelete, async (channel) => {
  channelDeleteLog(channel);
});

client.on(Events.GuildBanAdd, async (member) => {
  memberBanLog(member);
});

client.on(Events.GuildBanRemove, async (member) => {
  memberUnbanLog(member);
});

client.on(Events.MessageDelete, async (message) => {
  messageDeleteLog(message);
});

client.on(Events.MessageUpdate, async (message, newMessage) => {
  messageUpdateLog(message, newMessage);
});

client.on(Events.GuildMemberRemove, async (member) => {
  memberRemoveLog(member);
});

client.login(config.DISCORD_TOKEN);
