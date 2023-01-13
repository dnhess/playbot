import type { TextChannel } from 'discord.js';
import {
  ActionRowBuilder,
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

import * as commandModules from './commands';
import config from './config';
import { messages } from './messages/messages';
import { joinReactionSchema } from './Schemas/joinReaction';
import { levelSchema } from './Schemas/level';
import { welcomeSchema } from './Schemas/welcome';
import { welcomeDMSchema } from './Schemas/welcomeDM';

const commands = Object(commandModules);

export const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences,
  ],
});

client.once(Events.ClientReady, async (c) => {
  console.log(`Ready! Logged in as ${c.user.tag}!`);

  client.user?.setActivity('Listening for your commands!');

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
    // Remove hyphens from command name
    const commandNameNoHyphens = commandName.replace(/-/g, '');
    commands[commandNameNoHyphens]?.execute(interaction, client);
  } else if (interaction.isAutocomplete()) {
    const { commandName } = interaction;
    console.log(`Received qutocomplete interaction: ${commandName}`);
    // Remove hyphens from command name
    const commandNameNoHyphens = commandName.replace(/-/g, '');

    await commands[commandNameNoHyphens]?.autocomplete(interaction, client);
  } else if (interaction.isButton()) {
    const { customId } = interaction;
    console.log(`Received button interaction with the id: ${customId}`);

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
              (channel) => channel.name === data.channel
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
// TODO: Figure out how to make this work by storing the message in a db so I don't have to redeploy the bot every time I want to change the message
client.on(Events.MessageCreate, async (message) => {
  const { guild, author } = message;
  // If bot sent the message, ignore it
  if (message.author.username === client?.user?.username || !guild) return;

  levelSchema.findOne(
    { guildId: guild.id, userId: author.id },
    async (err: any, data: any) => {
      if (err) throw err;

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
// TODO: Figure out how to make this work by storing the message in a db so I don't have to redeploy the bot every time I want to change the message
// TODO: Also figure out how to make this work by checking to see if it is enabled in the db
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
          (channel) => channel.name === data.channel
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
          (channel) => channel.name === data.channel
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

        // @ts-ignore
        member.send({ embeds: [welcomeEmbed], components: [buttonAction] });
      }
    }
  );
});

client.login(config.DISCORD_TOKEN);
