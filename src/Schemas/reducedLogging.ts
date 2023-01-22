import { model, Schema } from 'mongoose';

const reducedLoggingSchema = new Schema({
  guildId: String,
  channel: String,
});

export const reducedLogsSchema = model('reduced-logs', reducedLoggingSchema);
