import type { CommandInteraction } from 'discord.js';
import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('reportad')
  .setDescription(
    'Help users out by running this command! It will direct them to the correct email for help. '
  );

export const execute = async (interaction: CommandInteraction) => {
  return interaction.reply(
    `ello! Sorry you saw an inappropriate ad. We work hard to ensure the quality of ads is as good as can be. Can you please upload a picture or name of the ad you saw here so we can turn it off? Thanks! https://playbite.zendesk.com/hc/en-us/requests/new`
  );
};
