import { track } from '@amplitude/analytics-node';
import type { Message, TextChannel } from 'discord.js';
import { EmbedBuilder } from 'discord.js';
import { DateTime } from 'luxon';

import { levelSchema } from '../Schemas/level';

export const levelCheck = async (message: Message) => {
  const { guild, author } = message;
  if (!guild || author.bot) return;

  // If message is not type text return
  if (message.channel.type !== 0) {
    console.log(
      `Message from ${author} is not type text, skipping level increase`
    );
    return;
  }

  // Ignore messages less than 5 characters
  if (message?.content.length < 5) {
    console.log('Ignoring message due to less than 5 characters');
    return;
  }

  const eventProperties = {
    guildId: guild.id,
    guildName: guild.name,
    userName: author.username,
    userId: author.id,
  };

  track(
    'Message Received',
    {
      type: 'Level Check',
      ...eventProperties,
    },
    {
      user_id: author.id,
      time: Date.now(),
    }
  );

  levelSchema.findOne(
    { guildId: guild.id, userId: author.id },
    async (err: any, data: any) => {
      if (err) throw err;

      if (!data) {
        levelSchema.create({
          guildId: guild.id,
          userId: author.id,
          XP: 0,
          level: 0,
        });
      } else {
        if (data?.updatedAt) {
          const updatedAtTime = DateTime.fromJSDate(new Date(data.updatedAt));
          const currentTime = DateTime.local();

          const duration = currentTime.diff(updatedAtTime);

          if (duration.as('seconds') < 1) {
            console.log(
              `Skipping level increase for ${author?.tag} not enough time has passed`
            );
            return;
          }
        }

        const give = 1;
        const requiredXP = 5 * data.level ** 2 + 50 * data.level + 100;
        const channel = message.channel as TextChannel;
        // @ts-ignore
        if (data.XP + give >= requiredXP) {
          // @ts-ignore
          // eslint-disable-next-line no-param-reassign
          data.level += 1;

          // If data.totalXP is undefined set it to current XP
          if (!data.totalXP) {
            // @ts-ignore
            // eslint-disable-next-line no-param-reassign
            data.totalXP = data.XP;
          }

          // Increase level difficulty after level 10... this is a bit of a hack
          // because I messed up and didn't reset the XP when I increased the
          // level. This is in place so it is fair for everyone who hasn't already
          // reached level 10 before this change.
          if (data.level >= 10) {
            // @ts-ignore
            // eslint-disable-next-line no-param-reassign
            data.totalXP += give;
            // @ts-ignore
            // eslint-disable-next-line no-param-reassign
            data.XP = 0;
          } else {
            // @ts-ignore
            // eslint-disable-next-line no-param-reassign
            data.XP += give;
            // @ts-ignore
            // eslint-disable-next-line no-param-reassign
            data.totalXP += give;
          }

          await data.save();

          if (!channel) return;

          const levelUpEmbed = new EmbedBuilder()
            .setTitle('Level Up!')
            .setDescription(`${author} has leveled up to level ${data.level}!`)
            .setColor('#00ff00');

          const levelEventProperties = {
            oldLevel: data.level - 1,
            newLevel: data.level,
            userName: author.username,
            guildId: guild?.id,
            guildName: guild?.name,
          };

          track('Level Increase', levelEventProperties, {
            user_id: author.id,
            time: Date.now(),
          });

          channel.send({ embeds: [levelUpEmbed] });
        } else {
          // @ts-ignore
          // eslint-disable-next-line no-param-reassign
          data.XP += give;
          if (data.level < 10) {
            // @ts-ignore
            // eslint-disable-next-line no-param-reassign
            data.totalXP = data.XP;
          } else {
            // @ts-ignore
            // eslint-disable-next-line no-param-reassign
            data.totalXP += give;
          }

          await data.save();
        }
      }
    }
  );
};
