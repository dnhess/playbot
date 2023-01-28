// @ts-nocheck
import type { CommandInteraction } from 'discord.js';
import {
  ChannelType,
  EmbedBuilder,
  PermissionsBitField,
  SlashCommandBuilder,
} from 'discord.js';
import ms from 'ms';

export const data = new SlashCommandBuilder()
  .setName('poll')
  .setDescription('Creates or ends a poll!')
  .addSubcommandGroup((group) =>
    group
      .setName('create')
      .setDescription('Creates a poll')
      .addSubcommand((subcommand) =>
        subcommand
          .setName('single')
          .setDescription('Creates a single choice poll')
          .addChannelOption((option) =>
            option
              .setName('channel')
              .setDescription('The channel to send the poll in')
              .addChannelTypes(ChannelType.GuildText)
              .setRequired(true)
          )
          .addStringOption((option) =>
            option
              .setName('question')
              .setDescription('The question to ask')
              .setRequired(true)
          )
          .addStringOption((option) =>
            option
              .setName('items')
              .setDescription('The items to choose from')
              .setRequired(true)
          )
          .addStringOption((option) =>
            option
              .setName('duration')
              .setDescription('The duration of the poll, 1d, 1h, 1m, 1s, etc.')
              .setRequired(true)
          )
          .addStringOption((option) =>
            option
              .setName('emoji')
              .setDescription('The custom emoji to use')
              .setRequired(false)
          )
      )
      .addSubcommand((subcommand) =>
        subcommand
          .setName('multiple')
          .setDescription('Creates a multiple choice poll')
          .addChannelOption((option) =>
            option
              .setName('channel')
              .setDescription('The channel to send the poll in')
              .addChannelTypes(ChannelType.GuildText)
              .setRequired(true)
          )
          .addStringOption((option) =>
            option
              .setName('question')
              .setDescription('The question to ask')
              .setRequired(true)
          )
          .addStringOption((option) =>
            option
              .setName('items')
              .setDescription('The items to choose from')
              .setRequired(true)
          )
          .addStringOption((option) =>
            option
              .setName('duration')
              .setDescription('The duration of the poll, 1d, 1h, 1m, 1s, etc.')
              .setRequired(true)
          )
          .addStringOption((option) =>
            option
              .setName('emoji')
              .setDescription('The custom emoji to use')
              .setRequired(false)
          )
      )
  )
  .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator);

// eslint-disable-next-line consistent-return
export const execute = async (interaction: CommandInteraction) => {
  const subcommandGroup = interaction.options.getSubcommandGroup();

  if (subcommandGroup === 'create') {
    const channel = interaction.options.getChannel('channel');
    const question = interaction.options.getString('question');
    const items = interaction.options.getString('items');
    const duration = interaction.options.getString('duration');
    const emoji = interaction.options.getString('emoji');
    const pollType = interaction.options.getSubcommand();

    const itemArray = items.split(', ');
    const customEmojis = emoji?.split(', ');

    const emojis = [
      '1️⃣',
      '2️⃣',
      '3️⃣',
      '4️⃣',
      '5️⃣',
      '6️⃣',
      '7️⃣',
      '8️⃣',
      '9️⃣',
      '🔟',
      '⬆️',
      '⬇️',
      '⬅️',
      '➡️',
      '🅰️',
      '🅱️',
      '🔴',
      '🟠',
      '🟡',
      '🟢',
      '🔵',
      '🟣',
      '🟤',
      '⚫',
      '⚪',
      '🟧',
    ];

    if (customEmojis && customEmojis.length !== itemArray.length) {
      return interaction.reply({
        content: 'The amount of custom emojis must match the amount of items!',
        ephemeral: true,
      });
    }

    if (itemArray.length > 26) {
      return interaction.reply({
        content: 'You can only have up to 26 items!',
        ephemeral: true,
      });
    }

    // If duration is not valid, return
    if (!ms(duration)) {
      return interaction.reply({
        content: 'Please enter a valid duration!',
        ephemeral: true,
      });
    }

    // If using custom emojis find the emojis and replace the default ones
    if (customEmojis) {
      customEmojis.forEach((customEmoji, index) => {
        const emojiID = customEmoji.split(':').pop();

        const foundEmoji =
          interaction.guild.emojis.cache.get(emojiID) || customEmoji;

        if (foundEmoji) {
          emojis[index] = foundEmoji.toString();
        }
      });
    }

    // If itemsArray is less than emojisArray, remove the extra emojis
    if (itemArray.length < emojis.length) {
      emojis.splice(itemArray.length);
    }

    const descriptionArray = [];

    // Build the description formatted as emoji - item
    itemArray.forEach((item, index) => {
      descriptionArray[index] = `${emojis[index]} - ${item}\n`;
    });

    const embed = new EmbedBuilder()
      .setTitle(question)
      .setDescription(descriptionArray.join(''))
      .setFooter({
        text: `Poll ends in ${duration}`,
      })
      .setColor('#7E47F3');

    const message = await channel.send({ embeds: [embed] });

    // Add the reactions to the message
    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < itemArray.length; i++) {
      try {
        // eslint-disable-next-line no-await-in-loop
        await message.react(emojis[i]);
      } catch (error) {
        console.log(error);
        // Delete the message if there is an error
        message.delete();
        // Return so the rest of the code doesn't run
        return interaction.reply({
          content: 'There was an error adding the emojis! Poll cancelled.',
          ephemeral: true,
        });
      }
    }

    // Add a collector to the message, if the user reacts with one of the emojis, count it
    // If the duration is up, end the collector and send the results
    const collector = message.createReactionCollector({
      filter: (reaction, user) => {
        if (user.bot) return false;
        // If the reaction is not in the emojis array, delte the reaction
        if (!emojis.includes(reaction.emoji.name)) {
          try {
            reaction.users.remove(user);
          } catch (error) {
            console.log(error);
          }
          return false;
        }
        return true;
      },
      time: ms(duration),
    });

    const results = [];

    collector.on('collect', async (reaction) => {
      const index = emojis.indexOf(reaction.emoji.name);

      // If pollType is single and the user has already reacted, remove the oldest reaction
      if (pollType === 'single') {
        const userReactions = message.reactions.cache.filter((r) =>
          r.users.cache.has(interaction.user.id)
        );

        if (userReactions.size > 1) {
          try {
            // eslint-disable-next-line no-restricted-syntax
            for (const uReactions of userReactions.values()) {
              // If reaction == uReactions, continue
              if (reaction.emoji.name !== uReactions.emoji.name) {
                // eslint-disable-next-line no-await-in-loop
                await uReactions.users.remove(interaction.user.id);

                // Remove the reaction from the results array
                // eslint-disable-next-line no-plusplus
                results[emojis.indexOf(uReactions.emoji.name)]--;
              }
            }
          } catch (error) {
            console.error('Failed to remove reactions.');
          }
        }
      }

      if (results[index]) {
        // eslint-disable-next-line no-plusplus
        results[index]++;
      } else {
        results[index] = 1;
      }
    });

    collector.on('end', () => {
      const resultsArray = [];

      // Sort the results in descending order
      results.sort((a, b) => b - a);

      results.forEach((result, index) => {
        // Ignore the result if it is undefined or 0 (no votes)
        if (!result || result === 0) return;

        resultsArray[
          index
        ] = `${emojis[index]} - ${itemArray[index]} - ${result} votes`;
      });

      const resultsEmbed = new EmbedBuilder()
        .setTitle(question)
        .setDescription(resultsArray.join('\n'))
        .setFooter({
          text: 'Poll has ended and the results are in!',
        })
        .setColor('#7E47F3');

      message.edit({ embeds: [resultsEmbed] });

      message.reactions.removeAll();
    });

    return interaction.reply({
      content: 'Poll created!',
      ephemeral: true,
    });
  }
};
