import type { CommandInteraction } from 'discord.js';
import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('reportad')
  .setDescription(
    'Found an innappropriate ad? Report it here and we will turn it off!'
  );

export const execute = async (interaction: CommandInteraction) => {
  return interaction.reply(
    `Hello! Sorry you saw an inappropriate ad. We work hard to ensure the quality of ads is as good as can be. Can you please upload a picture or name of the ad you saw here so we can turn it off? Thanks! https://playbite.zendesk.com/hc/en-us/requests/new`
  );
};
