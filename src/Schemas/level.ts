import { model, Schema } from 'mongoose';

const levelSchemaSettings = new Schema(
  {
    guildId: String,
    userId: String,
    XP: Number,
    level: Number,
  },
  { timestamps: true }
);

export const levelSchema = model('levels', levelSchemaSettings);
