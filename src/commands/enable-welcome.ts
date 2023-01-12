// @ts-nocheck
import type { CommandInteraction } from 'discord.js';
import {
  EmbedBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from 'discord.js';

import { welcomeSchema } from '../Schemas/welcome';

export const data = new SlashCommandBuilder()
  .setName('enable-welcome')
  .setDescription('Enables welcome messages on the server')
  .addStringOption((option) =>
    option
      .setName('channel')
      .setDescription('The channel to send the welcome message in')
      .setRequired(true)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ADMINISTRATOR);

// eslint-disable-next-line consistent-return
export const execute = async (interaction: CommandInteraction) => {
  const channel = interaction.options.getString('channel');
  const perm = new EmbedBuilder()
    .setColor('#7E47F3')
    .setDescription(`:x: You do not have the permissions to use this command!`);

  if (!interaction.member.permissions.has('ADMINISTRATOR')) {
    return interaction.reply({ embeds: [perm] });
  }

  await interaction.deferReply({ ephemeral: true });

  const { guildId } = interaction;

  // Add the welcome message to the database
  await welcomeSchema.updateOne(
    {
      guildId,
      channel,
    },
    {},
    { upsert: true }
  );

  // Replay with a success message only if the welcome message was added to the database
  // This message is only visible to the user who ran the command
  const embed = new EmbedBuilder()
    .setColor('#7E47F3')
    .setDescription(
      `:white_check_mark: Successfully enabled welcome messages in ${channel} !`
    );

  return interaction.editReply({ embeds: [embed] });
};
