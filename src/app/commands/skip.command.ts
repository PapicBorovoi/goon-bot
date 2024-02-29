import {
  CacheType,
  ChatInputCommandInteraction,
  GuildMember,
  SlashCommandBuilder,
} from 'discord.js';
import { Command } from './command.interface';
import { inject, injectable } from 'inversify';
import { Component } from '@/shared/types/component.enum';
import { VoiceInfoRepository } from './music/voice-info.repository';
import { Logger } from '@/shared/logger/logger.interface';

@injectable()
export class SkipCommand implements Command {
  public _data = new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Skips the current song.')
    .setDMPermission(false);

  constructor(
    @inject(Component.VoiceInfoRepository)
    private readonly voiceInfoRepository: VoiceInfoRepository,
    @inject(Component.Logger) private readonly logger: Logger
  ) {}

  public get data() {
    return this._data;
  }

  public async execute(interaction: ChatInputCommandInteraction<CacheType>) {
    const voiceInfo = this.voiceInfoRepository.get(
      interaction.guildId as string
    );

    if (!voiceInfo || !voiceInfo.isBotConnected) {
      return await interaction.reply({
        content: 'I am not in a voice channel.',
        ephemeral: true,
      });
    }

    if (
      (interaction.member as GuildMember).voice.channelId !==
      interaction.guild?.members.me?.voice.channelId
    ) {
      return await interaction.reply({
        content: 'You are not in the same voice channel as me.',
        ephemeral: true,
      });
    }

    if (voiceInfo.player.state.status !== 'playing') {
      return await interaction.reply({
        content: 'There is no song playing.',
        ephemeral: true,
      });
    }

    try {
      voiceInfo.player.stop();
    } catch (error) {
      this.logger.error(error as Error, 'Error while skipping the song.');
      return await interaction.reply({
        content: 'Error while skipping the song.',
        ephemeral: true,
      });
    }
    return await interaction.reply({
      content: 'Skipped the song.',
    });
  }
}
