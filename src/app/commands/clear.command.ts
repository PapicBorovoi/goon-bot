import { inject, injectable } from 'inversify';
import { Command } from './command.interface';
import {
  CacheType,
  ChatInputCommandInteraction,
  GuildMember,
  SlashCommandBuilder,
} from 'discord.js';
import { Component } from '@/shared/types/component.enum';
import { VoiceInfoRepository } from './music/voice-info.repository';
import { Logger } from '@/shared/logger/logger.interface';

@injectable()
export class ClearCommand implements Command {
  public _data = new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Clears the queue.')
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
    const guildId = interaction.guildId;

    if (!guildId) {
      return await interaction.reply({
        content: "You can't use this command in DM.",
        ephemeral: true,
      });
    }

    const voiceInfo = this.voiceInfoRepository.get(guildId);

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

    if (voiceInfo.queue.length === 0) {
      return await interaction.reply({
        content: 'The queue is already empty.',
        ephemeral: true,
      });
    }

    this.voiceInfoRepository.update(guildId, {
      queue: [],
    });

    return await interaction.reply({
      content: 'The queue has been cleared.',
    });
  }
}
