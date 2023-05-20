import { track } from '@amplitude/analytics-node';
import fetch from 'cross-fetch';
import {
  ChannelType,
  Client,
  Events,
  GatewayIntentBits,
  InteractionType,
  Partials,
} from 'discord.js';
// Import mongoose
import mongoose from 'mongoose';

// eslint-disable-next-line import/no-cycle
import * as commandModules from './commands';
import config from './config';
import topJob from './cronJobs/top';
import { buttonWelcomeDM } from './events/buttons/buttonWelcomeDM';
import { levelCheck } from './events/levelCheck';
import { auditLogEventCreateLog } from './events/logging/auditLogEventCreateLog';
import { channelCreateLog } from './events/logging/channelCreateLog';
import { channelDeleteLog } from './events/logging/channelDeleteLog';
import { modalWelcomeDM } from './events/modals/modalWelcomeDM';
import { reactionRoleEvent } from './events/reactions/reactionRoleEvent';
import { sendJoinReaction } from './events/welcome/sendJoinReaction';
import { sendWelcome } from './events/welcome/sendWelcome';
import { sendWelcomeDM } from './events/welcome/sendWelcomeDM';
import { convertGameResponseToGameData } from './interfaces/IGame';
import { messages } from './messages/messages';
import { checkRegion } from './messages/ocr';
import rollbar from './rollbarConfig';
import { pendingTasksSchema, Tasks } from './Schemas/pending-tasks';
import { UserSchema } from './Schemas/user';

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
  partials: [
    Partials.GuildMember,
    Partials.Message,
    Partials.Reaction,
    Partials.User,
    Partials.Channel,
  ],
});

client.once(Events.ClientReady, async (c) => {
  console.log(`Ready! Logged in as ${c.user.tag}!`);

  try {
    console.log('starting games fetching');
    const games = await fetch(`${config.BASE_API_URL}/feed?plat=web`);

    const gamesJson = await games.json();
    const gamesData = convertGameResponseToGameData(
      gamesJson.filter(
        (game: { title: string }) => game.title === 'All Games'
      )[0]
    );

    const choices: { name: string; value: string }[] = gamesData.map(
      (game) => ({
        name: game.name,
        value: game.id,
      })
    );

    const initalRandomGame =
      choices[Math.floor(Math.random() * choices.length)];

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
  } catch (error) {
    console.error(`Error during ClientReady event: ${error}`);
    console.log('Failed to set presence');
  }

  console.log('starting monogoose connection...');
  // ts ignore
  // @ts-ignore
  await mongoose.connect(config.MONODB_URL, {
    keepAlive: true,
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  if (mongoose.connection.readyState === 1) {
    console.log('Connected to MongoDB');

    // Start cron jobs
    topJob(client).start();
  }

  // Outout any monoogse errors
  mongoose.connection.on('error', (err) => {
    console.error(err);
  });
});

client.on(Events.MessageCreate, async (interaction) => {
  if (interaction.channel.type === ChannelType.DM) {
    // Get user id from pending tasks
    const userId = interaction.author.id;

    // TODO change this if there will be more than 1 eventually
    const hasPendingUsernameTask = await pendingTasksSchema.findOneAndDelete({
      userId,
      task: Tasks.userName,
    });

    if (hasPendingUsernameTask) {
      // Get content of message:
      const messageContent = interaction.content;

      // update user schema

      const referralLink = `https://s.playbite.com/invite/${messageContent}`;

      await UserSchema.replaceOne(
        {
          discord_id: userId,
        },
        {
          discord_id: userId,
          username: interaction.author.username,
          playbite_username: messageContent,
          discriminator: interaction.author.discriminator,
          avatar_url: interaction.author.avatarURL(),
          last_message: interaction.createdTimestamp,
        },
        { upsert: true }
      );

      const referralEmbed = `Here's your referral link: ${referralLink}`;

      interaction.reply(referralEmbed);
    }
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (interaction.isChatInputCommand()) {
      if (!interaction.guild) {
        console.log('Direct message interaction received and ignored');
        rollbar?.info('Direct message interaction received and ignored');
        return;
      }

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
      if (!interaction.guild) {
        console.log('Direct message interaction received and ignored');
        rollbar?.info('Direct message interaction received and ignored');
        return;
      }

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
  } catch (error) {
    console.error(`Error during InteractionCreate event: ${error}`);

    if (error instanceof Error) {
      const eventProperties = {
        error: error.message,
        userName: interaction.user.username,
        guildId: interaction.guildId,
        guildName: interaction.guild?.name,
      };

      rollbar?.error(error, eventProperties);
    }
  }
});

// On message create, check if the message matches given text
client.on(Events.MessageCreate, async (message) => {
  try {
    const { guild, author } = message;
    // If bot sent the message, ignore it
    if (
      message.author.username === client?.user?.username ||
      !guild ||
      author.bot
    )
      return;

    levelCheck(message);

    // If message is a reply, ignore it
    if (message.reference) return;

    messages.forEach((msg) => {
      if (msg.message.test(message.content)) {
        if (typeof msg.response === 'function') {
          message.channel.send(
            // @ts-ignore
            msg.response ? msg.response(message) : 'No response'
          );
        } else {
          message.channel.send(msg.response);
        }
      }
    });

    checkRegion(message);
  } catch (error) {
    console.error(`Error during MessageCreate event: ${error}`);

    if (error instanceof Error) {
      const eventProperties = {
        error: error?.message,
        userName: message?.author?.username,
        guildId: message?.guildId,
        guildName: message.guild?.name,
      };

      rollbar?.error(error, eventProperties);
    }
  }
});

// On user join, send a message to welcome them, DM the user with a modal to ask for their username
client.on(Events.GuildMemberAdd, (member) => {
  try {
    sendWelcome(member);
    sendJoinReaction(member);
    sendWelcomeDM(member);
  } catch (error) {
    console.error(`Error during GuildMemberAdd event: ${error}`);

    if (error instanceof Error) {
      const eventProperties = {
        error: error.message,
        userName: member?.user?.username,
        guildName: member.guild?.name,
      };

      rollbar?.error(error, eventProperties);
    }
  }
});

// On emoji reaction, handle the reaction
client.on(Events.MessageReactionAdd, async (reaction, user) => {
  try {
    if (user.bot) return;

    reactionRoleEvent(reaction, user, client, true);
  } catch (error) {
    console.error(`Error during MessageReactionAdd event: ${error}`);

    if (error instanceof Error) {
      const eventProperties = {
        error: error.message,
        userName: user?.username,
        guildName: reaction?.message?.guild?.name,
      };

      rollbar?.error(error, eventProperties);
    }
  }
});

// On emoji reaction remove, handle the reaction
client.on(Events.MessageReactionRemove, async (reaction, user) => {
  try {
    console.log('reaction removed');
    if (user.bot) return;

    reactionRoleEvent(reaction, user, client, false);
  } catch (error) {
    console.error(`Error during MessageReactionRemove event: ${error}`);

    if (error instanceof Error) {
      const eventProperties = {
        error: error.message,
        userName: user?.username,
        guildName: reaction?.message?.guild?.name,
      };

      rollbar?.error(error, eventProperties);
    }
  }
});

// MOD LOGS
client.on(Events.ChannelCreate, async (channel) => {
  try {
    channelCreateLog(channel);
  } catch (error) {
    console.error(`Error during ChannelCreate event: ${error}`);

    if (error instanceof Error) {
      const eventProperties = {
        error: error.message,
        userName: channel?.guild?.name,
        guildName: channel.guild?.name,
      };

      rollbar?.error(error, eventProperties);
    }
  }
});

client.on(Events.ChannelDelete, async (channel) => {
  try {
    channelDeleteLog(channel);
  } catch (error) {
    console.error(`Error during ChannelDelete event: ${error}`);

    if (error instanceof Error) {
      const eventProperties = {
        error: error.message,
      };

      rollbar?.error(error, eventProperties);
    }
  }
});

client.on(Events.GuildAuditLogEntryCreate, async (auditLog, guild) => {
  try {
    auditLogEventCreateLog(auditLog, guild);
  } catch (error) {
    console.error(`Error during GuildAuditLogEntryCreate event: ${error}`);

    if (error instanceof Error) {
      const eventProperties = {
        error: error.message,
      };

      rollbar?.error(error, eventProperties);
    }
  }
});

client.login(config.DISCORD_TOKEN);
