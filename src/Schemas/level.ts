import { model, Schema } from 'mongoose';

const levelSchemaSettings = new Schema({
  guild: String,
  user: String,
  XP: Number,
  level: Number,
});

export const levelSchema = model('levelSchema', levelSchemaSettings);
