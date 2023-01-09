import type { CommandInteraction } from 'discord.js';
import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('drops')
  .setDescription('Times for all the drops!');

export const execute = async (interaction: CommandInteraction) => {
  return interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setTitle('Drops')
        .setDescription('Times for all the drops!')
        .setImage(
          'https://media.discordapp.net/attachments/876983102830968874/1022663018779263067/unknown.png?width=319&height=904'
        ),
    ],
  });
};
