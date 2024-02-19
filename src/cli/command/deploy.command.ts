import { Command } from './command.interface';
import * as path from 'node:path';
import * as fs from 'node:fs';
import { REST, Routes } from 'discord.js';
import { Command as DsCommand } from '../../app/commands/command.interface';

export class DeployCommand implements Command {
  constructor() {}

  public getName(): string {
    return '--deploy';
  }

  public async execute(): Promise<void> {
    const commands = [];
    const commandsPath = path.join(__dirname, '..', '..', 'app', 'commands');
    const commandFiles = fs
      .readdirSync(commandsPath)
      .filter(
        (file) => file.split('.')[file.split('.').length - 2] === 'command'
      );

    for (const file of commandFiles) {
      const command: DsCommand = await import(path.join(commandsPath, file));
      commands.push(command.data.toJSON());
    }

    if (!process.env.TOKEN) {
      console.error('Token not found');
      return;
    }

    const rest = new REST().setToken(process.env.TOKEN);

    try {
      console.log(
        `Started refreshing ${commands.length} application (/) commands.`
      );

      if (!process.env.CLIENT_ID) {
        console.error('Client ID not found');
        return;
      }

      const data = await rest.put(
        Routes.applicationCommands(process.env.CLIENT_ID),
        {
          body: commands,
        }
      );

      console.log(
        `Successfully reloaded ${
          (data as unknown[]).length
        } application (/) commands.`
      );
    } catch (error) {
      console.error(error);
    }
  }
}
