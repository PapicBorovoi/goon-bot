import { ApplicationCommand, REST, Routes } from 'discord.js';
import { Command } from './command.interface';

export class DeleteCommand implements Command {
  public getName(): string {
    return '--delete';
  }

  public async execute(...parameters: string[]): Promise<void> {
    if (!process.env.TOKEN) {
      console.error('Token not found');
      return;
    }

    if (parameters.length === 0) {
      console.error('No command to delete found');
      return;
    }

    const rest = new REST().setToken(process.env.TOKEN);

    try {
      console.log('Started refreshing application (/) commands.');

      if (!process.env.CLIENT_ID) {
        console.error('Client ID not found');
        return;
      }

      let commands = await (<Promise<ApplicationCommand[]>>(
        rest.get(Routes.applicationCommands(process.env.CLIENT_ID))
      ));

      let ids: string[] = [];

      if (parameters.length === 1 && parameters[0] === 'all') {
        ids = commands.map((command) => command.id);
      } else {
        ids = commands
          .filter((commands) => parameters.includes(commands.name))
          .map((command) => command.id);
      }

      for (const id of ids) {
        await rest
          .delete(Routes.applicationCommand(process.env.CLIENT_ID, id))
          .then(() =>
            console.log(
              `Successfully deleted application (/) command with id ${id}`
            )
          )
          .catch(console.error);
      }

      console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
      console.error(error);
    }
  }
}
