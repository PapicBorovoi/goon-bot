import { Command } from './command.interface';
import { REST, Routes } from 'discord.js';
import { VoiceInfoRepository } from '../../app/commands/music/voice-info.repository';
import { Logger } from '../../shared/logger/logger.interface';
import { PinoLogger } from '../../shared/logger/pino-loger';
import { MusicService } from '../../app/commands/music/music.service';
import { PlayCommand } from '../../app/commands/play.command';
import { SkipCommand } from '@/app/commands/skip.command';
import { ClearCommand } from '@/app/commands/clear.command';

export class DeployCommand implements Command {
  voiceInfoRepository: VoiceInfoRepository;
  logger: Logger;
  musicService: MusicService;
  playCommand: PlayCommand;
  skipCommand: SkipCommand;
  clearCommand: ClearCommand;

  constructor() {
    this.voiceInfoRepository = new VoiceInfoRepository();
    this.logger = new PinoLogger();
    this.musicService = new MusicService(this.voiceInfoRepository, this.logger);
    this.playCommand = new PlayCommand(
      this.voiceInfoRepository,
      this.logger,
      this.musicService
    );
    this.skipCommand = new SkipCommand(this.voiceInfoRepository, this.logger);
    this.clearCommand = new ClearCommand(this.voiceInfoRepository, this.logger);
  }

  public getName(): string {
    return '--deploy';
  }

  public async execute(): Promise<void> {
    const commands = [];

    commands.push(this.playCommand.data.toJSON());
    commands.push(this.skipCommand.data.toJSON());
    commands.push(this.clearCommand.data.toJSON());

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
