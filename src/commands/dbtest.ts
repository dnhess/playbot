import type { CommandInteraction } from 'discord.js';
import { SlashCommandBuilder } from 'discord.js';

import { test } from '../Schemas/test';

export const data = new SlashCommandBuilder()
  .setName('dbtest')
  .setDescription('dbtest');

export const execute = async (interaction: CommandInteraction) => {
  console.log('dbtest');
  test.findOne(
    // @ts-ignore
    { guildId: interaction.guild.id, userId: interaction.user.id },
    // eslint-disable-next-line @typescript-eslint/no-shadow, consistent-return
    async (err: any, data: any) => {
      if (err) throw err;

      if (!data) {
        test.create({
          // @ts-ignore
          guildId: interaction.guild.id,
          userId: interaction.user.id,
        });
      }

      if (data) {
        const user = data.userId;
        const guild = data.guildId;

        return interaction.reply(`user: ${user} guild: ${guild}`);
      }
    }
  );
};
