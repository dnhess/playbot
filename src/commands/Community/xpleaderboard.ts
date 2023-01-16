// @ts-nocheck
import type { CommandInteraction } from 'discord.js';
import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';

import { levelSchema } from '../../Schemas/level';

export const data = new SlashCommandBuilder()
  .setName('xp-leaderboard')
  .setDescription('This command returns the xp leaderboard for the server');

// eslint-disable-next-line consistent-return
export const execute = async (interaction: CommandInteraction) => {
  const { guild, client } = interaction;
  let text = '';

  const embed1 = new EmbedBuilder()
    .setColor('#7E47F3')
    .setDescription(`:x: No one is on the leaderboard yet!`);

  const Data = await levelSchema
    .find({ guildId: guild.id })
    .sort({ XP: -1, level: -1 })
    .limit(10);

  if (!Data) {
    return interaction.reply({ embeds: [embed1] });
  }

  await interaction.deferReply();

  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < Data.length; i++) {
    const { userId, XP, level } = Data[i];

    // eslint-disable-next-line no-await-in-loop
    const member = (await client.users.fetch(userId)) || 'Unknown Member';

    text += `**${i + 1}.** ${member} - Level: ${level} - XP: ${XP}\n`;

    const embed = new EmbedBuilder()
      .setColor('#7E47F3')
      .setTitle('XP Leaderboard')
      .setDescription(text);

    // eslint-disable-next-line no-await-in-loop
    await interaction.editReply({ embeds: [embed] });
  }
};
