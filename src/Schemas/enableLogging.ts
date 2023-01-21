import { model, Schema } from 'mongoose';

const guildLogsSchemaSettings = new Schema({
  guildId: String,
  channel: String,
});

export const guildLogsSchema = model('guild-logs', guildLogsSchemaSettings);
