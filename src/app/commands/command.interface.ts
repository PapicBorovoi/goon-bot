import { BaseInteraction } from 'discord.js';

export interface Command {
  data: {
    name: string;
    description: string;
    toJSON: () => Record<string, unknown>;
  };
  execute: (interaction: BaseInteraction) => Promise<void>;
}
