// @ts-nocheck
import type { CommandInteraction } from 'discord.js';
import {
  EmbedBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from 'discord.js';

import { levelSchema } from '../Schemas/level';

export const data = new SlashCommandBuilder()
  .setName('xpreset')
  .setDescription('Resets the xp of a user')
  .addUserOption((option) =>
    option
      .setName('user')
      .setDescription('The user to get the rank of')
      .setRequired(true)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ADMINISTRATOR);

// eslint-disable-next-line consistent-return
export const execute = async (interaction: CommandInteraction) => {
  const perm = new EmbedBuilder()
    .setColor('#7E47F3')
    .setDescription(`:x: You do not have the permissions to use this command!`);

  if (!interaction.member.permissions.has('ADMINISTRATOR')) {
    return interaction.reply({ embeds: [perm] });
  }

  const { guildId } = interaction;

  const target = interaction.options.getUser('user');

  levelSchema.deleteMany({ guildId, userId: target.id }, async () => {
    const embed = new EmbedBuilder()
      .setColor('#7E47F3')
      .setDescription(
        `:white_check_mark: Successfully reset the xp of ${target.tag}`
      );

    await interaction.reply({ embeds: [embed] });
  });
};
