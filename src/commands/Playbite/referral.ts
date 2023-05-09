import type { CommandInteraction } from 'discord.js';
import { SlashCommandBuilder } from 'discord.js';

import { pendingTasksSchema, Tasks } from '../../Schemas/pending-tasks';

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

    await pendingTasksSchema.replaceOne(
      {
        guildId: interaction.guildId,
        userId,
      },
      {
        guildId: interaction.guildId,
        userId,
        task: Tasks.userName,
      },
      {
        upsert: true,
      }
    );
  } catch (error) {
    console.error(error);
    await interaction.reply({
      content:
        "It seems I can't send you a DM. Please make sure your DM settings allow messages from server members.",
      ephemeral: true,
    });
  }
};
