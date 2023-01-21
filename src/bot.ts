import { track } from '@amplitude/analytics-node';
import fetch from 'cross-fetch';
import type { TextChannel } from 'discord.js';
import {
  ActionRowBuilder,
  AuditLogEvent,
  ButtonBuilder,
  ButtonStyle,
  Client,
  EmbedBuilder,
  Events,
  GatewayIntentBits,
  InteractionType,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';
// Import mongoose
import mongoose from 'mongoose';

// eslint-disable-next-line import/no-cycle
import * as commandModules from './commands';
import config from './config';
import { convertGameResponseToGameData } from './interfaces/IGame';
import { messages } from './messages/messages';
import { guildLogsSchema } from './Schemas/enableLogging';
import { joinReactionSchema } from './Schemas/joinReaction';
import { levelSchema } from './Schemas/level';
import { welcomeSchema } from './Schemas/welcome';
import { welcomeDMSchema } from './Schemas/welcomeDM';

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

    if (customId === 'welcome-modal-btn') {
      // Get the guild from welcomeDM schema
      welcomeDMSchema.findOne(
        { guildID: interaction.guildId },
        async (err: any, data: { messages: string[]; title: string }) => {
          if (err) throw err;

          if (data) {
            const welcomeModal = new ModalBuilder()
              .setTitle(data.title)
              .setCustomId(`welcome-modal-${interaction.guildId}`);

            // Build inputs for each message
            data.messages.forEach((message, index) => {
              // If message is null or undefined, return
              if (!message) return;

              const input = new TextInputBuilder()
                .setCustomId(`welcome-message-${index}`)
                .setLabel(`${message}`)
                .setMinLength(3)
                .setStyle(TextInputStyle.Paragraph);

              const actionRow = new ActionRowBuilder().addComponents(input);
              // @ts-ignore
              welcomeModal.addComponents(actionRow);
            });

            await interaction.showModal(welcomeModal);
          }
        }
      );
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

    if (customId === `welcome-modal-${interaction.guildId}`) {
      // Get the guild from welcomeDM schema
      welcomeDMSchema.findOne(
        { guildID: interaction.guildId },
        async (
          err: any,
          data: {
            messages: string[];
            title: string;
            channel: string;
            reply: string;
          }
        ) => {
          if (err) throw err;

          if (data) {
            // Get all text input values from modal

            type TextInputResponse = {
              name: string;
              value: string;
            };

            const responses: TextInputResponse[] = [];

            data.messages.forEach((message, index) => {
              // If message is null or undefined, return
              if (!message) return;
              const response = interaction.fields.getTextInputValue(
                `welcome-message-${index}`
              );
              responses.push({
                name: message,
                value: response,
              });
            });

            console.log(
              `Received responses from welcome-modal-${interaction.guildId}`
            );
            // Post inbed to channel
            const embed = new EmbedBuilder()
              .setTitle('Welcome Form Response')
              .setDescription(
                `Welcome form response from ${interaction.user.username}#${interaction.user.discriminator}`
              )
              .addFields(responses);

            // Get the channel name from the interaction
            const adminChannel = client.channels.cache.find(
              // @ts-ignore
              (channel) => channel.id === data.channel
            );

            console.log(`Channel Name to send data to: ${adminChannel}`);

            if (!adminChannel) return;

            if (adminChannel) {
              // @ts-ignore
              await adminChannel.send({ embeds: [embed] });
            }

            interaction.reply(data.reply);
          }
        }
      );
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
    message.author.bot
  )
    return;

  levelSchema.findOne(
    { guildId: guild.id, userId: author.id },
    async (err: any, data: any) => {
      if (err) throw err;

      // If bot sent the message, ignore it
      if (message.author.bot) return;

      if (!data) {
        levelSchema.create({
          guildId: guild.id,
          userId: author.id,
          XP: 0,
          level: 0,
        });
      } else {
        const give = 1;
        const requiredXP = 5 * data.level ** 2 + 50 * data.level + 100;
        const channel = message.channel as TextChannel;
        // @ts-ignore
        if (data.XP + give >= requiredXP) {
          // @ts-ignore
          // eslint-disable-next-line no-param-reassign
          data.XP += give;
          // @ts-ignore
          // eslint-disable-next-line no-param-reassign
          data.level += 1;
          await data.save();

          if (!channel) return;

          const levelUpEmbed = new EmbedBuilder()
            .setTitle('Level Up!')
            .setDescription(`${author} has leveled up to level ${data.level}!`)
            .setColor('#00ff00');

          const eventProperties = {
            oldLevel: data.level - 1,
            newLevel: data.level,
            userName: author.username,
            guildId: guild?.id,
            guildName: guild?.name,
          };

          track('Level Increase', eventProperties, {
            user_id: author.id,
            time: Date.now(),
          });

          channel.send({ embeds: [levelUpEmbed] });
        } else {
          // @ts-ignore
          // eslint-disable-next-line no-param-reassign
          data.XP += give;
          await data.save();
        }
      }
    }
  );

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
  // If guild id is in welcomeSchema, send a welcome message to the given channel
  welcomeSchema.findOne(
    { guildId: member.guild.id },
    async (err: any, data: { channel: string }) => {
      if (err) throw err;

      if (data) {
        console.log(`Welcome message enabled for ${member.guild.name}`);
        console.log(`Sending welcome message to ${data.channel}`);
        const welcomeChannel = member.guild.channels.cache.find(
          (channel) => channel.id === data.channel
        );

        if (!welcomeChannel) return;

        if (welcomeChannel) {
          const welcomeEmbed = new EmbedBuilder()
            .setTitle('Welcome to the server!')
            .setDescription(
              `${member} has joined the server! Make sure to read the rules!`
            )
            .setThumbnail(member.user.avatarURL())
            .setColor('#00ff00');

          // @ts-ignore
          welcomeChannel.send({ embeds: [welcomeEmbed] });
        }
      }
    }
  );

  // If guild id is in guildWelcomeReaction, add the given reaction to the welcome message
  joinReactionSchema.findOne(
    { guildId: member.guild.id },
    async (err: any, data: { emojiName: string; channel: string }) => {
      if (err) throw err;

      if (data) {
        console.log(`Welcome reaction enabled for ${member.guild.name}`);
        console.log(
          `Sending welcome reaction in ${data.channel} with emoji ${data.emojiName}`
        );
        // Get emoji name from guild.emoji
        const emoji = member.guild.emojis.cache.find(
          // eslint-disable-next-line @typescript-eslint/no-shadow
          (emoji) => emoji.name === data.emojiName
        );

        // Add emoji to welcome message
        const welcomeChannel = member.guild.channels.cache.find(
          (channel) => channel.id === data.channel
        );

        if (!welcomeChannel || !emoji) return;

        if (welcomeChannel) {
          // @ts-ignore
          // eslint-disable-next-line @typescript-eslint/no-shadow
          welcomeChannel.messages.fetch({ limit: 1 }).then((messages) => {
            // @ts-ignore
            messages.first().react(emoji);
          });
        }
      }
    }
  );

  // If this is in welcomeDmSchema, send a welcome DM to user with a modal with data.description and data.messages

  welcomeDMSchema.findOne(
    { guildId: member.guild.id },
    async (
      err: any,
      data: { description: string; messages: string[]; title: string }
    ) => {
      if (err) throw err;

      if (data) {
        console.log(
          `Member joined and welcome DMs are enabled for ${member.guild.name}`
        );
        console.log(`Sending welcome DM to ${member.user.username}`);

        const welcomeEmbed = new EmbedBuilder()
          .setTitle(`${data.title}`)
          .setDescription(`${data.description}`);

        const buttonAction = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`welcome-modal-btn`)
            .setLabel('Get Started')
            .setStyle(ButtonStyle.Primary)
        );

        try {
          // @ts-ignore
          member.send({ embeds: [welcomeEmbed], components: [buttonAction] });
        } catch (e) {
          console.log(`Failed to send welcome DM to ${member.user.username}`);
        }
      }
    }
  );
});

// MOD LOGS
// TODO: Separate this into a different file
client.on(Events.ChannelCreate, async (channel) => {
  channel.guild
    .fetchAuditLogs({
      type: AuditLogEvent.ChannelCreate,
    })
    .then((audit) => {
      const executor = audit.entries.first();

      const { name, id, type } = channel;

      // If missing values or is a bot return
      if (!name || !id || !type || executor?.executor?.bot) return;

      let typeText = '';
      // @ts-ignore
      if (type === 0) {
        typeText = 'Text';
      } else if (type === 2) {
        typeText = 'Voice';
      } else if (type === 4) {
        typeText = 'Category';
      } else if (type === 5) {
        typeText = 'News';
      } else if (type === 15) {
        typeText = 'Forum';
      }

      console.log(`Channel created: ${name} (${id}) of type ${type}`);

      // Check if loggin is enabled for this guild
      guildLogsSchema.findOne(
        { guildId: channel.guild.id },
        async (err: any, data: { channel: string }) => {
          if (err) throw err;

          if (data) {
            const mChannel = channel.guild.channels.cache.get(data.channel);

            if (!mChannel) return;

            const logEmbed = new EmbedBuilder()
              .setColor('Red')
              .setTitle('Channel Created')
              .addFields(
                {
                  name: 'Channel Name',
                  value: `${name} (<#${id}>)`,
                  inline: false,
                },
                {
                  name: 'Channel Type',
                  value: `${typeText}`,
                  inline: false,
                },
                {
                  name: 'Channel ID',
                  value: `${id}`,
                  inline: false,
                },
                {
                  name: 'Created By',
                  value: `${executor?.executor?.username}#${executor?.executor?.discriminator}`,
                  inline: false,
                }
              );

            // @ts-ignore
            mChannel.send({ embeds: [logEmbed] });
          }
        }
      );
    });
});

client.on(Events.ChannelDelete, async (channel) => {
  // @ts-ignore
  channel.guild
    .fetchAuditLogs({
      type: AuditLogEvent.ChannelDelete,
    })
    // @ts-ignore
    .then((audit) => {
      const executor = audit.entries.first();
      // @ts-ignore
      const { name, id, type } = channel;

      // If missing values or is a bot return
      if (!name || !id || !type || executor?.executor?.bot) return;

      let typeText = '';

      // @ts-ignore
      if (type === 0) {
        typeText = 'Text';
      } else if (type === 2) {
        typeText = 'Voice';
      } else if (type === 4) {
        typeText = 'Category';
      } else if (type === 5) {
        typeText = 'News';
      } else if (type === 15) {
        typeText = 'Forum';
      }

      console.log(`Channel created: ${name} (${id}) of type ${type}`);

      // Check if loggin is enabled for this guild
      guildLogsSchema.findOne(
        // @ts-ignore
        { guildId: channel.guild.id },
        async (err: any, data: { channel: string }) => {
          if (err) throw err;

          if (data) {
            // @ts-ignore
            const mChannel = channel.guild.channels.cache.get(data.channel);
            if (!mChannel) return;
            const logEmbed = new EmbedBuilder()
              .setColor('Red')
              .setTitle('Channel Deleted')
              .addFields(
                {
                  name: 'Channel Name',
                  value: `${name}`,
                  inline: false,
                },
                {
                  name: 'Channel Type',
                  value: `${typeText}`,
                  inline: false,
                },
                {
                  name: 'Channel ID',
                  value: `${id}`,
                  inline: false,
                },
                {
                  name: 'Deleted By',
                  value: `${executor?.executor?.username}#${executor?.executor?.discriminator}`,
                  inline: false,
                }
              );

            // @ts-ignore
            mChannel.send({ embeds: [logEmbed] });
          }
        }
      );
    });
});

client.on(Events.GuildBanAdd, async (member) => {
  // @ts-ignore
  member.guild
    .fetchAuditLogs({
      // @ts-ignore
      type: AuditLogEvent.GuildBanAdd,
    })
    // @ts-ignore
    .then((audit) => {
      console.log(
        `Received ban event for ${member.user.tag} (${member.user.id})`
      );
      const executor = audit.entries.first();
      // @ts-ignore
      const { id } = member.user;
      const name = member.user.username;

      // If the executor is a bot or missing values then return
      if (!executor || !id || !name) return;

      // Check if logging is enabled for this guild
      guildLogsSchema.findOne(
        // @ts-ignore
        { guildId: member.guild.id },
        async (err: any, data: { channel: string }) => {
          if (err) throw err;

          if (data) {
            // @ts-ignore
            const mChannel = member.guild.channels.cache.get(data.channel);
            if (!mChannel) return;
            const logEmbed = new EmbedBuilder()
              .setColor('Red')
              .setTitle('Member Banned')
              .addFields(
                {
                  name: 'Member Name',
                  value: `${name} (<@${id}>)`,
                  inline: false,
                },
                {
                  name: 'Member ID',
                  value: `${id}`,
                  inline: false,
                },
                {
                  name: 'Banned By',
                  value: `${executor?.executor?.username}#${executor?.executor?.discriminator}`,
                  inline: false,
                },
                {
                  name: 'Reason',
                  value: `${executor?.reason}`,
                  inline: false,
                }
              );

            // @ts-ignore
            mChannel.send({ embeds: [logEmbed] });
          }
        }
      );
    });
});

client.on(Events.GuildBanRemove, async (member) => {
  // @ts-ignore
  member.guild
    .fetchAuditLogs({
      type: AuditLogEvent.MemberBanRemove,
    })
    // @ts-ignore
    .then((audit) => {
      console.log(
        `Received unban event for ${member.user.tag} (${member.user.id})`
      );
      const executor = audit.entries.first();
      // @ts-ignore
      const { id } = member.user;
      const name = member.user.username;

      // If missing values or executor is a bot, return
      if (!id || !name || !executor || executor?.executor?.bot) return;

      // Check if loggin is enabled for this guild
      guildLogsSchema.findOne(
        // @ts-ignore
        { guildId: member.guild.id },
        async (err: any, data: { channel: string }) => {
          if (err) throw err;

          if (data) {
            // @ts-ignore
            const mChannel = member.guild.channels.cache.get(data.channel);
            if (!mChannel) return;
            const logEmbed = new EmbedBuilder()
              .setColor('Red')
              .setTitle('Member Unbanned')
              .addFields(
                {
                  name: 'Member Name',
                  value: `${name} (<@${id}>)`,
                  inline: false,
                },
                {
                  name: 'Member ID',
                  value: `${id}`,
                  inline: false,
                },
                {
                  name: 'Unbanned By',
                  value: `${executor?.executor?.username}#${executor?.executor?.discriminator}`,
                  inline: false,
                }
              );

            // @ts-ignore
            mChannel.send({ embeds: [logEmbed] });
          }
        }
      );
    });
});

client.on(Events.MessageDelete, async (message) => {
  if (!message.guild) return;
  message.guild
    .fetchAuditLogs({
      type: AuditLogEvent.MessageDelete,
    })
    // @ts-ignore
    .then((audit) => {
      const executor = audit.entries.first();
      // @ts-ignore
      const mes = message.content;

      // If missing values or message is from a bot return
      if (!mes || message?.author?.bot || !executor) return;

      // Check if loggin is enabled for this guild
      guildLogsSchema.findOne(
        // @ts-ignore
        { guildId: message.guild.id },
        async (err: any, data: { channel: string }) => {
          if (err) throw err;

          if (data) {
            // @ts-ignore
            const mChannel = message.guild.channels.cache.get(data.channel);
            if (!mChannel) return;
            const logEmbed = new EmbedBuilder()
              .setColor('Red')
              .setTitle('Message Deleted')
              .addFields(
                {
                  name: 'Message Content',
                  value: `${mes}`,
                  inline: false,
                },
                {
                  name: 'Member Channel',
                  value: `${message.channel}`,
                  inline: false,
                },
                {
                  name: 'Deleted By',
                  value: `${executor?.executor?.username}#${executor?.executor?.discriminator}`,
                  inline: false,
                }
              );

            // @ts-ignore
            mChannel.send({ embeds: [logEmbed] });
          }
        }
      );
    });
});

client.on(Events.MessageUpdate, async (message, newMessage) => {
  // @ts-ignore
  message.guild
    .fetchAuditLogs({
      // @ts-ignore
      type: AuditLogEvent.MessageUpdate,
    })
    // @ts-ignore
    .then((audit) => {
      const executor = audit.entries.first();
      // @ts-ignore
      const mes = message.content;

      // If the message is from a bot, return
      if (message?.author?.bot || !executor || !mes) return;

      // Check if loggin is enabled for this guild
      guildLogsSchema.findOne(
        // @ts-ignore
        { guildId: message.guild.id },
        async (err: any, data: { channel: string }) => {
          if (err) throw err;

          if (data) {
            // @ts-ignore
            const mChannel = message.guild.channels.cache.get(data.channel);
            if (!mChannel) return;
            const logEmbed = new EmbedBuilder()
              .setColor('Red')
              .setTitle('Message Edited')
              .addFields(
                {
                  name: 'Old Message Content',
                  value: `${mes}`,
                  inline: false,
                },
                {
                  name: 'New Message Content',
                  value: `${newMessage}`,
                  inline: false,
                },
                {
                  name: 'Member Channel',
                  value: `${message.channel}`,
                  inline: false,
                },
                {
                  name: 'Edited By',
                  value: `${executor?.executor?.username}#${executor?.executor?.discriminator}`,
                  inline: false,
                }
              );

            // @ts-ignore
            mChannel.send({ embeds: [logEmbed] });
          }
        }
      );
    });
});

client.on(Events.GuildMemberRemove, async (member) => {
  // @ts-ignore
  member.guild
    .fetchAuditLogs({
      type: AuditLogEvent.MemberKick,
    })
    // @ts-ignore
    .then((audit) => {
      const executor = audit.entries.first();
      // @ts-ignore
      const { id } = member.user;
      const name = member.user.username;

      if (executor?.action !== AuditLogEvent.MemberKick) return;

      // If missing values or message is from a bot return
      if (!executor || !id || !name || member?.user?.bot) return;

      // If user kicked themselves return
      if (executor?.executor?.id === id) return;

      // Check if loggin is enabled for this guild
      guildLogsSchema.findOne(
        // @ts-ignore
        { guildId: member.guild.id },
        async (err: any, data: { channel: string }) => {
          if (err) throw err;

          if (data) {
            // @ts-ignore
            const mChannel = member.guild.channels.cache.get(data.channel);
            if (!mChannel) return;
            const logEmbed = new EmbedBuilder()
              .setColor('Red')
              .setTitle('Member Kicked')
              .addFields(
                {
                  name: 'Member Name',
                  value: `${name} (<@${id}>)`,
                  inline: false,
                },
                {
                  name: 'Member ID',
                  value: `${id}`,
                  inline: false,
                },
                {
                  name: 'Kicked By',
                  value: `${executor?.executor?.username}#${executor?.executor?.discriminator}`,
                  inline: false,
                },
                {
                  name: 'Reason',
                  value: `${executor?.reason}`,
                  inline: false,
                }
              );

            // @ts-ignore
            mChannel.send({ embeds: [logEmbed] });
          }
        }
      );
    });
});

client.login(config.DISCORD_TOKEN);
