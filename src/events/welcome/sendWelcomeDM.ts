import type { GuildMember } from 'discord.js';
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from 'discord.js';

import { welcomeDMSchema } from '../../Schemas/welcomeDM';

export const sendWelcomeDM = async (member: GuildMember) => {
  welcomeDMSchema.findOne(
    { guildId: member.guild.id },
    async (
      err: any,
      data: { description: string; messages: string[]; title: string }
    ) => {
      if (err) throw err;

      if (data) {
        console.log(
          `Member joined and welcome DMs are enabled for ${member.guild.name}`
        );
        console.log(`Sending welcome DM to ${member.user.username}`);

        const welcomeEmbed = new EmbedBuilder()
          .setTitle(`${data.title}`)
          .setDescription(`${data.description}`);

        const buttonAction = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`welcome-modal-btn`)
            .setLabel('Get Started')
            .setStyle(ButtonStyle.Primary)
        );

        try {
          // @ts-ignore
          member.send({ embeds: [welcomeEmbed], components: [buttonAction] });
        } catch (e) {
          console.log(`Failed to send welcome DM to ${member.user.username}`);
        }
      }
    }
  );
};
