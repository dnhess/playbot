import { model, Schema } from 'mongoose';

const welcomeDMSchemaSettings = new Schema({
  guildId: String,
  messages: Array,
  description: String,
  channel: String,
  title: String,
  reply: String,
});

export const welcomeDMSchema = model(
  'memberDMWelcome',
  welcomeDMSchemaSettings
);
