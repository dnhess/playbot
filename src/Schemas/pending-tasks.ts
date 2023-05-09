import { model, Schema } from 'mongoose';

export enum Tasks {
  userName = 'USERNAME',
}

const pendingTaskSchemaSettings = new Schema(
  {
    guildId: String,
    userId: String,
    task: String,
  },
  { timestamps: true }
);

export const pendingTasksSchema = model(
  'pending-tasks',
  pendingTaskSchemaSettings
);
