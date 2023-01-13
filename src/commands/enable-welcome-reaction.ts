// @ts-nocheck
import type { CommandInteraction } from 'discord.js';
import {
  EmbedBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from 'discord.js';

import { joinReactionSchema } from '../Schemas/joinReaction';

export const data = new SlashCommandBuilder()
  .setName('enable-welcome-reaction')
  .setDescription('Applies a reaction to the welcome message')
  .addStringOption((option) =>
    option
      .setName('channel')
      .setDescription('The channel to send the welcome message in')
      .setRequired(true)
  )
  .addStringOption((option) =>
    option
      .setName('emoji')
      .setDescription('The emoji to react with')
      .setRequired(true)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ADMINISTRATOR)
  .setDefaultPermission(false);

// eslint-disable-next-line consistent-return
export const execute = async (interaction: CommandInteraction) => {
  const channel = interaction.options.getString('channel');
  const emoji = interaction.options.getString('emoji');
  const perm = new EmbedBuilder()
    .setColor('#7E47F3')
    .setDescription(`:x: You do not have the permissions to use this command!`);

  if (!interaction.member.permissions.has('ADMINISTRATOR')) {
    return interaction.reply({ embeds: [perm] });
  }

  await interaction.deferReply({ ephemeral: true });

  const { guildId } = interaction;

  // Check to see if joinReactionSchema exists if so delete
  // const joinReactionSchemaExists = await joinReactionSchema.findOne({
  //   guildId,
  //   channel,
  // });

  // if (joinReactionSchemaExists) {
  //   await joinReactionSchema.deleteOne({
  //     guildId,
  //     channel,
  //   });
  // }

  // Add the welcome message to the database
  await joinReactionSchema.replaceOne(
    {
      guildId,
    },
    {
      guildId,
      channel,
      emojiName: emoji,
    },
    { upsert: true }
  );

  // Replay with a success message only if the welcome message was added to the database
  // This message is only visible to the user who ran the command
  const embed = new EmbedBuilder()
    .setColor('#7E47F3')
    .setDescription(
      `:white_check_mark: Successfully enabled welcome reaction ${emoji} in ${channel} !`
    );

  return interaction.editReply({ embeds: [embed] });
};
