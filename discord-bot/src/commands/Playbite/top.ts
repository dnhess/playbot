import type { CommandInteraction } from 'discord.js';
import { SlashCommandBuilder } from 'discord.js';

import { fetchGamesWithTopUsersOverOneDayEmbed } from '../../helpers/topCommand';

export const data = new SlashCommandBuilder()
  .setName('top')
  .setDescription('Get the top user in all the games over the last 24 hours');

export type UserCounts = {
  [key: string]: {
    count: number;
    games: {
      name: string;
      points: number;
    }[];
  };
};

export const execute = async (interaction: CommandInteraction) => {
  // Defer the reply
  await interaction.deferReply();

  // Fetch all the games
  const embeds = await fetchGamesWithTopUsersOverOneDayEmbed();

  // Send the embeds
  await interaction.editReply({
    embeds,
  });
};
