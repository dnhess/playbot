import { model, Schema } from 'mongoose';

const joinReactionSchemaSettings = new Schema({
  guildId: String,
  emojiName: String,
  channel: String,
});

export const joinReactionSchema = model(
  'guild-welcome-reaction',
  joinReactionSchemaSettings
);
