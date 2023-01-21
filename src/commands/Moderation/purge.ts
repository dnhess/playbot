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

  // Before bulk deleting the messages, ensure the user is not trying to delete a high role message
  // This is done by fetching the messages and checking the author's highest role

  // Fetch the messages
  const messages = await interaction.channel?.messages.fetch({
    limit: number,
  });

  // Check the author's highest role
  const highestRole = interaction.member?.roles.highest;

  // Filter the messages
  const filteredMessages = messages?.filter((message) => {
    const authorHighestRole = message.member?.roles.highest;

    // If the author's highest role is higher than the user's highest role, return false
    if (authorHighestRole?.position >= highestRole?.position) {
      return false;
    }

    return true;

    // If the author's highest role is lower than the user's highest role, return true
  });

  // If the filtered messages are less than the number of messages the user wants to delete, return an error

  if (filteredMessages?.size !== number) {
    const filteredEmbedError = new EmbedBuilder()
      .setColor('#7E47F3')
      .setDescription(
        `:x: You cannot delete messages that are from a higher role than you!`
      );

    return interaction.reply({ embeds: [filteredEmbedError], ephemeral: true });

    // If the filtered messages are equal to the number of messages the user wants to delete, bulk delete the messages
  }

  await interaction.channel?.bulkDelete(number);

  await interaction.reply({ embeds: [embed], ephemeral: true });
};
