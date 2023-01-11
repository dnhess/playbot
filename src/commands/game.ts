import fetch from 'cross-fetch';
import type { ChatInputCommandInteraction } from 'discord.js';
import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { DateTime } from 'luxon';

import config from '../config';
import { convertGameResponseToGameData } from '../interfaces/IGame';

export const data = new SlashCommandBuilder()
  .setName('game')
  .setDescription('Find more information about a game.')
  .addStringOption((option) =>
    option
      .setName('name')
      .setDescription('The name of the game')
      .setRequired(true)
      .setAutocomplete(true)
  );

export const autocomplete = async (
  interaction: ChatInputCommandInteraction
) => {
  // @ts-ignore
  const focusedOption = interaction.options.getFocused();

  const games = await fetch(
    `${config.BASE_API_URL}/feed?plat=web`
  );
  const gamesJson = await games.json();

  const gamesData = convertGameResponseToGameData(
    gamesJson.filter((game: { title: string }) => game.title === 'All')[0]
  );

  const choices: { name: string; value: string }[] = gamesData.map(
    (game) => ({
      name: game.name,
      value: game.id,
    })
  );

  if (focusedOption) {
    const filteredChoices = choices.filter((choice) =>
      choice.name.toLowerCase().includes(focusedOption.value.toLowerCase())
    );

    // @ts-ignore
    return interaction.respond(filteredChoices.slice(0, 25));
  }
  // @ts-ignore
  return interaction.respond(choices.slice(0, 25));
};

export const execute = async (interaction: ChatInputCommandInteraction) => {
  await interaction.deferReply();
  const gameId = interaction.options.getString('name');
  const game = await fetch(
    `${config.BASE_API_URL}/feed?plat=web`
  );

  const gameJson = await game.json();

  const gamesData = convertGameResponseToGameData(
    gameJson.filter((game: { title: string }) => game.title === 'All')[0]
  );


  // Find the game where the id matches the game id
  const foundGame = gamesData.find((gameItem) => gameItem.id === gameId);

  if (!foundGame) {
    return interaction.editReply(`Game not found.`);
  }

  const rankings = await Promise.all([
    fetch(`${config.BASE_API_URL}/games/${gameId}/rankings?type=all`),
    fetch(`${config.BASE_API_URL}/games/${gameId}/rankings?type=day`),
    fetch(`${config.BASE_API_URL}/games/${gameId}/rankings?type=week`),
  ]);

  
  // Get the json from the rankings
  const rankingsJson = await Promise.all(rankings.map((r) => r.json()));

  // Get all, day, week rankings as index 0, 1, 2
  const allRankings = rankingsJson[0];
  const dayRankings = rankingsJson[1];
  const weekRankings = rankingsJson[2];

  // Get the top 10 rankings for each
  const top10All = allRankings.slice(0, 10);
  const top10Day = dayRankings.slice(0, 10);
  const top10Week = weekRankings.slice(0, 10);

  // Map the rankings to a string
  const top10AllString = top10All.map(
    (r: { position: string; name: string; points: string }) =>
      `${r.position}. ${r.name} - ${r.points} \n`
  );
  const top10DayString = top10Day.map(
    (r: { position: string; name: string; points: string }) =>
      `${r.position}. ${r.name} - ${r.points} \n`
  );
  const top10WeekString = top10Week.map(
    (r: { position: string; name: string; points: string }) =>
      `${r.position}. ${r.name} - ${r.points} \n`
  );

  const fields = [
    {
      name: 'All Time Rankings',
      value: top10AllString.join(''),
    },
    {
      name: 'Weekly Rankings',
      value: top10WeekString.join(''),
    },
    {
      name: 'Daily Rankings',
      value: top10DayString.join(''),
    },
  ];

  return interaction.editReply({
    embeds: [
      new EmbedBuilder()
        .setTitle(foundGame?.name)
        .setDescription(foundGame?.description)
        .setColor('#7E47F3')
        .setThumbnail(foundGame?.promoImageUrl || '')
        .addFields(fields)
    ],
  });
};
