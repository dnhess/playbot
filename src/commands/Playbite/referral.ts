import type { CommandInteraction } from 'discord.js';
import { SlashCommandBuilder } from 'discord.js';

import { UserSchema } from '../../Schemas/user';

export const data = new SlashCommandBuilder()
  .setName('referral')
  .setDescription('Generate your referral link.');

export const execute = async (interaction: CommandInteraction) => {
  const userId = interaction.user.id;

  try {
    const dmChannel = await interaction.user.createDM();
    const questionText =
      'What is your Playbite username? (This can be found by clicking on your profile in the top right corner of the app)';
    await dmChannel.send(questionText);

    await interaction.reply({
      content: "I've sent you a DM with a question about your username.",
      ephemeral: true,
    });

    interaction.client.once('messageCreate', async (message) => {
      if (message.author.id === userId) {
        const desiredUsername = message.content;

        const referralLink = `https://s.playbite.com/invite/${desiredUsername}`;

        await UserSchema.replaceOne(
          {
            discord_id: userId,
          },
          {
            discord_id: userId,
            username: interaction.user.username,
            playbite_username: null,
            discriminator: interaction.user.discriminator,
            avatar_url: interaction.user.displayAvatarURL(),
            last_message: interaction.createdTimestamp,
          },
          { upsert: true }
        );

        const referralEmbed = `Here's your referral link: ${referralLink}`;

        await dmChannel.send(referralEmbed);
      }
    });
  } catch (error) {
    await interaction.reply({
      content:
        "It seems I can't send you a DM. Please make sure your DM settings allow messages from server members.",
      ephemeral: true,
    });
  }
};
