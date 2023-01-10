import type { CommandInteraction } from 'discord.js';
import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('play')
  .setDescription('Play now in your browser! Returns a link to the game.');

export const execute = async (interaction: CommandInteraction) => {
  return interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setTitle('play')
        .setDescription('Earn awesome rewards by playing games!')
        .setImage(
          'https://uploads-ssl.webflow.com/5edd8e1d77a7c53d4e3a6a46/5eddc5d1aa51752e01883ba1_P%20Logo%403x.png'
        )
        .setURL('https://app.playbite.com/'),
    ],
  });
};
