// @ts-nocheck
import type { CommandInteraction } from 'discord.js';
import {
  EmbedBuilder,
  PermissionsBitField,
  SlashCommandBuilder,
} from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('purge')
  .setDescription('Removes X number of messages from a channel')
  .addIntegerOption((option) =>
    option
      .setName('amount')
      .setDescription('The amount of messages you wish to delete')
      .setMinValue(1)
      .setMaxValue(100)
      .setRequired(true)
  )
  .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageMessages);
// eslint-disable-next-line consistent-return
export const execute = async (interaction: CommandInteraction) => {
  const number = interaction.options.getInteger('amount');

  const embed = new EmbedBuilder()
    .setColor('#7E47F3')
    .setDescription(
      `:white_check_mark: Successfully **deleted** ${number} messages!`
    );

  await interaction.channel?.bulkDelete(number);

  await interaction.reply({ embeds: [embed], ephemeral: true });
};
