import { model, Schema } from 'mongoose';

const cronJobSchemaSettings = new Schema({
  guildId: String,
  channelId: String,
  cronId: String,
});

export const cronJobSchema = model('cron-jobs', cronJobSchemaSettings);
