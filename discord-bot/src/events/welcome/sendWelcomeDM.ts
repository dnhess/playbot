import { track } from '@amplitude/analytics-node';
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
            .setCustomId(`welcome-modal-btn-${member.guild.id}`)
            .setLabel('Get Started')
            .setStyle(ButtonStyle.Primary)
        );

        try {
          const eventProperties = {
            guildId: member.guild.id,
            guildName: member.guild.name,
            userName: member.user.username,
            userId: member.user.id,
          };

          track(
            'Welcome',
            {
              type: 'Welcome DM',
              ...eventProperties,
            },
            {
              user_id: member.user.id,
              time: Date.now(),
            }
          );
          member
            // @ts-ignore
            .send({ embeds: [welcomeEmbed], components: [buttonAction] })
            .catch((e) => {
              console.log(
                `Failed to send welcome DM to ${member.user.username}`
              );
              console.log(e);
            });
        } catch (e) {
          console.log(`Failed to send welcome DM to ${member.user.username}`);
        }
      }
    }
  );
};
