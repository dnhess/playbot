import { model, Schema } from 'mongoose';

const welcomeSchemaSettings = new Schema({
  guildId: String,
  channel: String,
});

export const welcomeSchema = model('guild-welcome', welcomeSchemaSettings);
