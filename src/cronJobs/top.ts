import type { Client } from 'discord.js';
import { DateTime } from 'luxon';
import cron from 'node-cron';

import { fetchGamesWithTopUsersOverOneDayEmbed } from '../helpers/topCommand';
import { cronJobSchema } from '../Schemas/cronJobs';

const action = async (client: Client) => {
  console.log('Checking to see if cron job top should run...');
  // Get all cron jobs with the cronId of 'top'
  const jobs = await cronJobSchema.find({ cronId: 'top' });

  // Run the cron job only if the current time is 11:59 PM CST using luxon
  const now = DateTime.local();
  const time = now.setZone('America/Chicago').toFormat('HH:mm');
  if (time !== '23:59') return;

  console.log('Running cron job top');
  // Loop through each job
  jobs.forEach(async (job) => {
    if (!job.guildId || !job.channelId) return;
    // Fetch the channel
    const channel = await client.channels.fetch(job.channelId);
    // If the channel is not found, delete the job
    if (!channel) {
      await cronJobSchema.deleteOne({ guildId: job.guildId, cronId: 'top' });
      return;
    }
    // Fetch the embeds
    const embeds = await fetchGamesWithTopUsersOverOneDayEmbed();
    // Send the embeds
    // @ts-ignore
    await channel.send({ embeds });
  });
};

// Run cron job every 5 minutes

const topJob = (client: Client) =>
  cron.schedule('*/1 * * * *', () => action(client));

// Export job so it can be called in other files

export default topJob;
