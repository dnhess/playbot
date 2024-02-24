import fetch from 'cross-fetch';
import type { ChatInputCommandInteraction } from 'discord.js';
import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';

import config from '../../config';

type TUserStatsResponse = {
  displayName: string;
  bio: string;
  icon: string;
  description: string;
  value: string;
  stats: any;
  imageUrl: string;
};

export const data = new SlashCommandBuilder()
  .setName('user')
  .setDescription('Get info and stats for a Playbite user.')
  .addStringOption((option) =>
    option
      .setName('user')
      .setDescription('The user to get info for')
      .setRequired(true)
  );

export const execute = async (interaction: ChatInputCommandInteraction) => {
  await interaction.deferReply();
  const user = interaction.options.getString('user');
  const userStats = await fetch(`${config.BACKEND_URL}/user/${user}`);

  try {
    const userJson: TUserStatsResponse = await userStats.json();
    const fields = userJson?.stats.map((statItem: any) => ({
      name: `${statItem.icon} ${statItem.description}`.replace(
        'undefined ',
        ''
      ),
      value: statItem.value.toLocaleString(),
      inline: true,
    }));

    const embed = new EmbedBuilder()
      .setColor('#7E47F3')
      .setTitle(userJson?.displayName ?? '')
      .setDescription(userJson?.bio === '' ? ' ' : userJson?.bio)
      .setThumbnail(userJson?.imageUrl ?? '')
      .addFields(fields)
      .setTimestamp();

    return await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    return interaction.editReply(`User "${user}" not found.`);
  }
};
