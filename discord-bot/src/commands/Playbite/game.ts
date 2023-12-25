import fetch from 'cross-fetch';
import type { ChatInputCommandInteraction } from 'discord.js';
import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';

import config from '../../config';

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

  const gameResponse = await fetch(`${config.BACKEND_URL}/games`);
  const gamesJson = await gameResponse.json();

  const choices: { name: string; value: string }[] = gamesJson.games.map(
    (game: { name: any; id: any }) => ({
      name: game.name,
      value: game.name,
    })
  );

  if (focusedOption) {
    const filteredChoices = choices.filter((choice) =>
      choice.name.toLowerCase().includes(focusedOption.toLowerCase())
    );

    // @ts-ignore
    return interaction.respond(filteredChoices.slice(0, 25));
  }
  // @ts-ignore
  return interaction.respond(choices.slice(0, 25));
};

export const execute = async (interaction: ChatInputCommandInteraction) => {
  await interaction.deferReply();
  const gameName = interaction.options.getString('name');

  const gameResponse = await fetch(`${config.BACKEND_URL}/game/${gameName}`);

  if (gameResponse.status === 404) {
    return interaction.editReply(`Game "${gameName}" not found.`);
  }
  if (gameResponse.status !== 200) {
    return interaction.editReply(
      `There was an error getting the game "${gameName}". Send this to a developer: ${gameResponse.status}`
    );
  }

  const gameJson = await gameResponse.json();

  const { game, rankings } = gameJson;

  // Get the top 10 rankings for each
  const top10All = rankings.all.slice(0, 10);
  const top10Day = rankings.day.slice(0, 10);
  const top10Week = rankings.week.slice(0, 10);

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
        .setTitle(game?.name)
        .setDescription(game?.description)
        .setColor('#7E47F3')
        .setThumbnail(game?.promoImageUrl || '')
        .addFields(fields),
    ],
  });
};
