import { model, Schema } from 'mongoose';

const userSchema = new Schema(
  {
    discord_id: { type: String, required: true, unique: true },
    username: { type: String, required: true },
    discriminator: { type: Number, required: true },
    avatar_url: String,
    joined_at: { type: Date, required: true },
    playbite_username: { type: String, required: true },
    last_message: Date,
  },
  { timestamps: true }
);

export const UserSchema = model('user', userSchema);
