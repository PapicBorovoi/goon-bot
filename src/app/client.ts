import { GatewayIntentBits, Client } from 'discord.js';
import { injectable } from 'inversify';

@injectable()
export class DiscordClient {
  private readonly _client: Client;

  constructor() {
    this._client = new Client({
      intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
    });
  }

  get client(): Client {
    return this._client;
  }
}
