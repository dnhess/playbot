// @ts-nocheck
import type { CommandInteraction } from 'discord.js';
import {
  ChannelType,
  EmbedBuilder,
  PermissionsBitField,
  SlashCommandBuilder,
} from 'discord.js';

import { welcomeDMSchema } from '../../Schemas/welcomeDM';

export const data = new SlashCommandBuilder()
  .setName('enable-welcome-message-dm')
  .setDescription('Enables the welcome message in DMs')
  .addStringOption((option) =>
    option
      .setName('description')
      .setDescription('The description of the welcome message')
      .setRequired(true)
  )
  .addChannelOption((option) =>
    option
      .setName('channel')
      .setDescription('The channel to send the modal response to')
      .addChannelTypes(ChannelType.GuildText)
      .setRequired(true)
  )
  .addStringOption((option) =>
    option
      .setName('title')
      .setDescription('The title of the welcome message')
      .setRequired(true)
  )
  .addStringOption((option) =>
    option
      .setName('reply')
      .setDescription('The reply to a successful modal response')
      .setRequired(true)
  )
  .addStringOption((option) =>
    option
      .setName('message-1')
      .setDescription('The first message to send')
      .setMaxLength(45)
      .setRequired(true)
  )
  .addStringOption((option) =>
    option
      .setName('message-2')
      .setDescription('The second message to send')
      .setMaxLength(45)
      .setRequired(false)
  )
  .addStringOption((option) =>
    option
      .setName('message-3')
      .setDescription('The third message to send')
      .setMaxLength(45)
      .setRequired(false)
  )
  .addStringOption((option) =>
    option
      .setName('message-4')
      .setDescription('The fourth message to send')
      .setMaxLength(45)
      .setRequired(false)
  )
  .addStringOption((option) =>
    option
      .setName('message-5')
      .setDescription('The fifth message to send')
      .setMaxLength(45)
      .setRequired(false)
  )
  .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator);

// eslint-disable-next-line consistent-return
export const execute = async (interaction: CommandInteraction) => {
  const title = interaction.options.getString('title');
  const description = interaction.options.getString('description');
  const channel = interaction.options.getChannel('channel');
  const reply = interaction.options.getString('reply');
  const message1 = interaction.options.getString('message-1');
  const message2 = interaction.options.getString('message-2');
  const message3 = interaction.options.getString('message-3');
  const message4 = interaction.options.getString('message-4');
  const message5 = interaction.options.getString('message-5');

  await interaction.deferReply({ ephemeral: true });

  const { guildId } = interaction;

  // Build array of messages
  const messages = [message1, message2, message3, message4, message5];

  // Add the welcome message to the database
  await welcomeDMSchema.replaceOne(
    {
      guildId,
    },
    {
      guildId,
      messages,
      description,
      channel: channel.id,
      title,
      reply,
    },
    { upsert: true }
  );

  // Messages to send exclude null
  const messagesToSend = messages.filter((message) => message !== null);

  // Replay with a success message only if the welcome message was added to the database
  // This message is only visible to the user who ran the command
  const embed = new EmbedBuilder()
    .setColor('#7E47F3')
    .setDescription(
      `:white_check_mark: Successfully enabled welcome DM messages!\n\n**Title:** ${title}\n**Description:** ${description}\n**Channel:** ${channel}\n**Reply:** ${reply}\n**Messages:**\n${messagesToSend.join(
        ','
      )}`
    );

  return interaction.editReply({ embeds: [embed] });
};
