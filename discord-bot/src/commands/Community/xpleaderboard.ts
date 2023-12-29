// @ts-nocheck
import type { CommandInteraction } from 'discord.js';
import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';

import config from '../../config';

export const data = new SlashCommandBuilder()
  .setName('xp-leaderboard')
  .setDescription('This command returns the xp leaderboard for the server');

// eslint-disable-next-line consistent-return
export const execute = async (interaction: CommandInteraction) => {
  const { guild } = interaction;

  await interaction.deferReply();

  const embed1 = new EmbedBuilder()
    .setColor('#7E47F3')
    .setDescription(`:x: No one is on the leaderboard yet!`);

  const guildDataResponse = await fetch(
    `${config.BACKEND_URL}/guild/${guild.id}/leaderboard`
  );

  if (guildDataResponse.status !== 200) {
    return interaction.reply(`There was an error getting the leaderboard.`);
  }

  const guildData = await guildDataResponse.json();

  const leaderboard = guildData
    .map((user: any, index: number) => {
      return `**${index + 1}.** <@${user.userId}>- Level: ${user.level} - XP: ${
        user.totalXP ?? ''
      }`;
    })
    .join('\n');

  if (!leaderboard) {
    return interaction.editReply({ embeds: [embed1] });
  }

  const embed = new EmbedBuilder()
    .setColor('#7E47F3')
    .setTitle('XP Leaderboard')
    .setDescription(leaderboard);

  await interaction.editReply({ embeds: [embed] });
};
