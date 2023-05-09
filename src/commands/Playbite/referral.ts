import type { CommandInteraction } from 'discord.js';
import { SlashCommandBuilder } from 'discord.js';

import { pendingTasksSchema, tasks } from '../../Schemas/pending-tasks';
import { UserSchema } from '../../Schemas/user';
import { user } from '..';
// import { UserSchema } from '../../Schemas/user';

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

    await pendingTasksSchema.replaceOne({
      guildId: interaction.guildId,
      userId: userId
    }, {
      guildId: interaction.guildId,
      userId: userId,
      task: tasks.userName
    }, {
      upsert: true
    })

    const user = await UserSchema.findById({
      userId: userId
    })

    if (user && user.playbite_username) {
      const previousUserLink = `https://s.playbite.com/invite/${user.playbite_username}`

      await dmChannel.send(`This is the previous link I created for you: ${previousUserLink}, feel free to reply to this message if it has changed!`)
    }

  } catch (error) {
    console.error(error);
    await interaction.reply({
      content:
        "It seems I can't send you a DM. Please make sure your DM settings allow messages from server members.",
      ephemeral: true,
    });
  }
};
