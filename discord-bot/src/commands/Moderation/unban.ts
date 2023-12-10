// @ts-nocheck
import type { CommandInteraction } from 'discord.js';
import {
  EmbedBuilder,
  PermissionsBitField,
  SlashCommandBuilder,
} from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('unban')
  .setDescription('Unbans a user')
  .addUserOption((option) =>
    option.setName('user').setDescription('The user to unban').setRequired(true)
  )
  .addStringOption((option) =>
    option
      .setName('reason')
      .setDescription('The reason for unbanning the user')
      .setRequired(true)
  )
  .setDefaultMemberPermissions(PermissionsBitField.Flags.BanMembers);

// eslint-disable-next-line consistent-return
export const execute = async (interaction: CommandInteraction, client) => {
  const user = interaction.options.getUser('user');
  const reason = interaction.options.getString('reason');

  // Ensure the user is not trying to ban themselves
  if (user.id === interaction.user.id) {
    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor('#7E47F3')
          .setDescription('You cannot unban yourself!'),
      ],
    });
  }

  // Ensure the user is not trying to ban the bot
  if (user.id === client.user.id) {
    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor('#7E47F3')
          .setDescription('You cannot unban me!'),
      ],
    });
  }

  try {
    // Send a message to the user
    await interaction.guild.bans.fetch().then(async (bans) => {
      if (bans.size === 0)
        return interaction.reply('There are no bans!', {
          ephemeral: true,
        });
      const bUser = bans.find((b) => b.user.id === user.id);

      if (!bUser)
        return interaction.reply('That user is not banned!', {
          ephemeral: true,
        });

      await interaction.guild?.bans.remove(user, reason).catch((err) => {
        console.log(err);
        return interaction.reply('There was an error unbanning that user!', {
          ephemeral: true,
        });
      });

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('#7E47F3')
            .setDescription(
              `:white_check_mark: Successfully unbanned ${user} for ${reason}`
            ),
        ],
        ephemeral: true,
      });
    });
  } catch (err) {
    console.log(err);
  }
};
