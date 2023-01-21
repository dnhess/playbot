import { model, Schema } from 'mongoose';

const reactionRolesSchema = new Schema({
  guildId: String,
  channelId: String,
  messageId: String,
  roleId: String,
  emoji: String,
});

export const reactionRoles = model('reaction-roles', reactionRolesSchema);
