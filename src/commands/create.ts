import type { ChatInputCommandInteraction } from 'discord.js';
import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('create')
  .setDescription('Create new items for Playbite!')
  .addStringOption((option) =>
    option
      .setName('name')
      .setDescription('The name of the item')
      .setRequired(true)
      .addChoices({
        name: 'Collectible',
        value: 'collectible',
      })
  );

export const execute = async (interaction: ChatInputCommandInteraction) => {
  // Get the name of the item to create
  const name = interaction.options.getString('name');

  // If name is not one of the choices, return an error
  if (name !== 'collectible') {
    return interaction.reply({
      content: `Item "${name}" not found.`,
      ephemeral: true,
    });
  }

  // Create a new embed that returns link to the collecible website if choice is collectible
  const embed = new EmbedBuilder()
    .setColor('#7E47F3')
    .setTitle('Create a new collectible!')
    .setDescription(
      `To create a new collectible, go to [Create your Own Collectible on Playbite](https://www.playbite.com/creating-your-own-collectible-on-playbite/).`
    );

  // Reply with the embed

  return interaction.reply({ embeds: [embed] });
};
