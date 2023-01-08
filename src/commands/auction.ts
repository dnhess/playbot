import fetch from 'cross-fetch';
import type { ChatInputCommandInteraction } from 'discord.js';
import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { DateTime } from 'luxon';

import config from '../config';
import { convertAuctionsResponseToAuctionData } from '../interfaces/IAuctions';

export const data = new SlashCommandBuilder()
  .setName('auction')
  .setDescription('All current auction')
  .addStringOption((option) =>
    option
      .setName('name')
      .setDescription('The name of the auction')
      .setRequired(true)
      .setAutocomplete(true)
  );

export const autocomplete = async (
  interaction: ChatInputCommandInteraction
) => {
  // Get focused option
  // disalbe typescript error because it's not supportedyet
  // @ts-ignore
  const focusedOption = interaction.options.getFocused();

  const auctions = await fetch(
    `${config.BASE_API_URL}/auctions?plat=web-android`
  );
  const auctionsJson = await auctions.json();
  console.log('AUCTIONS JSON', auctionsJson);
  const auctionsData = convertAuctionsResponseToAuctionData(auctionsJson);

  // console.log('AUCTIONS', auctionsData);

  const choices: { name: string; value: string }[] = auctionsData.map(
    (auction) => ({
      name: auction.prizeName,
      value: auction.auctionId,
    })
  );

  console.log('CHOICES');
  console.log(choices);

  if (focusedOption) {
    console.log(auctionsData);
    // Filter autocomplete where status is not 2
    const filteredAuctions = auctionsData.filter(
      (auction) => auction.status === 0
    );

    // eslint-disable-next-line no-restricted-syntax
    for (const auction of filteredAuctions) {
      choices.push({
        name: auction.prizeName,
        value: auction.auctionId,
      });
    }
    // @ts-ignore

    return interaction.respond(choices);
  }
  // @ts-ignore
  return interaction.respond(choices);
};

export const execute = async (interaction: ChatInputCommandInteraction) => {
  await interaction.deferReply();
  const auctionId = interaction.options.getString('name');
  const auctions = await fetch(
    `${config.BASE_API_URL}/auctions?plat=web-android`
  );

  const auctionsJson = await auctions.json();
  console.log(`${auctionsJson}} AUCTIONS`);
  const auctionsData = convertAuctionsResponseToAuctionData(auctionsJson);

  const auction = auctionsData.find(
    (auctionItem) => auctionItem.auctionId === auctionId
  );

  if (!auction) {
    return interaction.editReply(`Auction "${auctionId}" not found.`);
  }

  const startDate = DateTime.local();
  const endDate = DateTime.fromISO(auction.endDate);

  // Calcuate how long until the auction ends
  const timeUntilEnd = endDate.diff(startDate, [
    'days',
    'hours',
    'minutes',
    'seconds',
  ]);

  const fields = [
    {
      name: 'Prize',
      value: 'test',
      inline: true,
    },
    {
      name: 'Current Bid',
      value: 'test',
      inline: true,
    },
    {
      name: 'Number of Bids',
      value: 'test',
      inline: true,
    },
  ];

  return interaction.editReply({
    embeds: [
      new EmbedBuilder()
        .setTitle('Auction')
        .setDescription('Auction description')
        .setColor('#7E47F3')
        .setThumbnail(auction.prizeImageUrl)
        .addFields(fields)
        .setFooter({
          text: `Auction ends in ${timeUntilEnd.days} days, ${timeUntilEnd.hours} hours, ${timeUntilEnd.minutes} minutes, and ${timeUntilEnd.seconds} seconds`,
        }),
    ],
  });
};
