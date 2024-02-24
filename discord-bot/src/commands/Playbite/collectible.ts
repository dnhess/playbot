import fetch from 'cross-fetch';
import type { ChatInputCommandInteraction } from 'discord.js';
import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';

import config from '../../config';
import { convertCollectiblesResponseToCollectiblesData } from '../../interfaces/ICollectibles';

export const data = new SlashCommandBuilder()
  .setName('collectible')
  .setDescription(
    'A list of Playbite collectibles. Go ahead, find your favorite!'
  )
  .addStringOption((option) =>
    option
      .setName('name')
      .setDescription('The name of the collectible')
      .setRequired(true)
      .setAutocomplete(true)
  );

export const autocomplete = async (
  interaction: ChatInputCommandInteraction
) => {
  const name = interaction.options.getString('name');
  const collectibles = await fetch(`${config.BASE_API_URL}/prizes`);
  const collectiblesJson = await collectibles.json();

  const collectiblesData =
    convertCollectiblesResponseToCollectiblesData(collectiblesJson);

  const collectibleNames = collectiblesData.map((collectible) => ({
    name: collectible.name,
    value: collectible.name,
  }));

  // @ts-ignore
  if (!name) return interaction.respond(collectibleNames.slice(0, 25));

  const filteredCollectibles = collectibleNames.filter((collectible) =>
    collectible.name.toLowerCase().includes(name.toLowerCase())
  );

  // @ts-ignore
  return interaction.respond(filteredCollectibles.slice(0, 25));
};

export const execute = async (interaction: ChatInputCommandInteraction) => {
  await interaction.deferReply();

  const name = interaction.options.getString('name');

  const collectibles = await fetch(`${config.BASE_API_URL}/prizes`);
  const collectiblesJson = await collectibles.json();

  const collectiblesData =
    convertCollectiblesResponseToCollectiblesData(collectiblesJson);

  const collectible = collectiblesData.find((item) => item.name === name);

  if (!collectible) {
    return interaction.editReply(`Collectible "${name}" not found.`);
  }

  const embed = new EmbedBuilder()
    .setColor('#7E47F3')
    .setTitle(collectible.name)
    .setDescription(collectible.description)
    .setThumbnail(collectible.promoImageUrl)
    .addFields([
      {
        name: 'Cost',
        value: collectible.cost.toLocaleString(),
        inline: true,
      },
      {
        name: 'Available',
        value:
          collectible.available.toLocaleString() === '-1'
            ? '∞'
            : collectible.available.toLocaleString(),
        inline: true,
      },
      {
        name: 'Redeems',
        value: collectible.redeems.toLocaleString(),
        inline: true,
      },
    ]);

  return interaction.editReply({ embeds: [embed] });
};
