import { Command } from './command/command.interface';
import { CommandParser } from './command-parser';
import chalk from 'chalk';

type CommandColection = Record<string, Command>;

export class CLIApplication {
  private commands: CommandColection = {};

  constructor(private readonly defaultCommand: string = '--deploy') {}

  public registerCommands(commandList: Command[]): void {
    commandList.forEach((command) => {
      if (this.commands.hasOwnProperty(command.getName())) {
        throw new Error(
          chalk.red(`Command ${command.getName()} is registered`)
        );
      }
      this.commands[command.getName()] = command;
    });
  }

  public getCommand(commandName: string): Command {
    return this.commands[commandName] ?? this.getDefaultCommand();
  }

  public getDefaultCommand(): Command | never {
    if (!this.commands[this.defaultCommand]) {
      throw new Error(
        chalk.red(
          `The default command (${this.defaultCommand}) is not registered.`
        )
      );
    } else {
      return this.commands[this.defaultCommand];
    }
  }

  public processCommand(argv: string[]): void {
    const parsedCommand = CommandParser.parse(argv);
    const [commandName] = Object.keys(parsedCommand);
    const command = this.getCommand(commandName);
    const commandArguments = parsedCommand[commandName] ?? [];
    command.execute(...commandArguments);
  }
}
