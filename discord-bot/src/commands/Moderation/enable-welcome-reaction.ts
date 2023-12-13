// @ts-nocheck
import type { CommandInteraction } from 'discord.js';
import {
  ChannelType,
  EmbedBuilder,
  PermissionsBitField,
  SlashCommandBuilder,
} from 'discord.js';

import { joinReactionSchema } from '../../Schemas/joinReaction';

export const data = new SlashCommandBuilder()
  .setName('enable-welcome-reaction')
  .setDescription('Applies a reaction to the welcome message')
  .addChannelOption((option) =>
    option
      .setName('channel')
      .setDescription('The channel to send the welcome message in')
      .addChannelTypes(ChannelType.GuildText)
      .setRequired(true)
  )
  .addStringOption((option) =>
    option
      .setName('emoji')
      .setDescription('The emoji to react with')
      .setRequired(true)
  )
  .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator);

// eslint-disable-next-line consistent-return
export const execute = async (interaction: CommandInteraction) => {
  const channel = interaction.options.getChannel('channel');
  const emoji = interaction.options.getString('emoji');

  await interaction.deferReply({ ephemeral: true });

  const { guildId } = interaction;

  // Add the welcome message to the database
  await joinReactionSchema.replaceOne(
    {
      guildId,
    },
    {
      guildId,
      channel: channel.id,
      emojiName: emoji,
    },
    { upsert: true }
  );

  // Find the emoji in the guild
  const emojiInGuild = interaction.guild.emojis.cache.find(
    (e) => e.name === emoji
  );

  // Replay with a success message only if the welcome message was added to the database
  // This message is only visible to the user who ran the command
  const embed = new EmbedBuilder()
    .setColor('#7E47F3')
    .setDescription(
      `:white_check_mark: Successfully enabled welcome reaction ${emojiInGuild} in ${channel} !`
    );

  return interaction.editReply({ embeds: [embed] });
};
