import { model, Schema } from 'mongoose';

const testSchema = new Schema({
  guildId: String,
  userId: String,
});

export const test = model('test', testSchema);
