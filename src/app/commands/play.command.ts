import { Logger } from '../../shared/logger/logger.interface';
import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  GuildMember,
  InteractionResponse,
} from 'discord.js';
import { createAudioResource } from '@discordjs/voice';
import { makeButton, makeEmbedResponse } from '../../shared/util/play.util';
import * as play from 'play-dl';
import { AWAIT_TIME_FOR_RESPONSE, MAX_QUEUE_LENGTH } from './command.const';
import { Command } from './command.interface';
import { inject, injectable } from 'inversify';
import { Component } from '../../shared/types/component.enum';
import { VoiceInfoRepository } from './music/voice-info.repository';
import { MusicService } from './music/music.service';

@injectable()
export class PlayCommand implements Command {
  private _data = new SlashCommandBuilder()
    .setName('play')
    .setDescription('Plays a song via YouTube link, id or search query.')
    .addStringOption((option) =>
      option
        .setName('video')
        .setDescription('YouTube link, id or search query.')
        .setRequired(true)
        .setMinLength(1)
        .setMaxLength(50)
    )
    .setDMPermission(false);

  constructor(
    @inject(Component.VoiceInfoRepository)
    private readonly voiceInfoRepository: VoiceInfoRepository,
    @inject(Component.Logger) private readonly logger: Logger,
    @inject(Component.MusicService) private readonly musicService: MusicService
  ) {
    if (!process.env.YT_COOKIE) {
      throw new Error('YT_COOKIE environment variable is not defined.');
    }

    play.setToken({
      youtube: {
        cookie: process.env.YT_COOKIE,
      },
    });
  }

  public get data() {
    return this._data;
  }

  private playSong = async (
    interaction: ChatInputCommandInteraction,
    ytURL: string
  ) => {
    const info = this.voiceInfoRepository.get(interaction.guildId as string);

    if (!info) {
      return;
    }

    try {
      if (info.firstPlay) {
        const audio = await play.stream(ytURL);

        const resource = createAudioResource(audio.stream, {
          inputType: audio.type,
        });

        info.player.play(resource);

        info.connection.subscribe(info.player);

        await interaction.followUp({
          content: `🎵 | Now playing:\n${ytURL}`,
        });

        this.voiceInfoRepository.update(interaction.guildId as string, {
          firstPlay: false,
        });
      } else {
        if (info.queue.length === MAX_QUEUE_LENGTH) {
          return await interaction.followUp({
            content: '❌ | Queue is full.',
          });
        }

        info.queue.push(ytURL);
        await interaction.followUp({
          content: `🎶 | Added to queue:\n${ytURL}`,
        });
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('age')) {
        await interaction.followUp({
          content: '❌ | Video is age restricted.',
          ephemeral: true,
        });
      } else {
        await interaction.followUp({
          content: '❌ | An error occurred while executing this command.',
          ephemeral: true,
        });
      }
    }
  };

  public async execute(interaction: ChatInputCommandInteraction) {
    const guild = interaction.guild;
    const guildId = interaction.guildId;
    const link = interaction.options.getString('video');
    const voiceChannel = (interaction.member as GuildMember).voice.channel;

    if (!guildId || !voiceChannel || !guild) {
      return interaction.reply({
        content: '❌ | You must be in a voice channel to use this command.',
        ephemeral: true,
      });
    }

    if (!voiceChannel.joinable) {
      return interaction.reply({
        content: '❌ | I do not have permission to join your voice channel.',
        ephemeral: true,
      });
    }

    if (!link) {
      return await interaction.reply({
        content: '❌ | Invalid YouTube video URL.',
        ephemeral: true,
      });
    }

    let info = this.voiceInfoRepository.get(guildId);

    if (info === undefined) {
      info = await this.musicService.addNewVoiceInfo({
        guildId,
        interaction,
        voiceChannel,
        guild,
      });
    } else {
      this.musicService.connect(info, {
        guildId,
        interaction,
        voiceChannel,
        guild,
      });
    }

    if (!info) {
      return interaction.reply({
        content: '❌ | An error occurred while executing this command.',
        ephemeral: true,
      });
    }

    if (
      info.isBotConnected &&
      info.player.playable &&
      (interaction.member as GuildMember).voice.channelId !==
        guild.members.me?.voice.channelId
    ) {
      return await interaction.reply({
        content: '❌ | Use this command in same voice channel as bot.',
        ephemeral: true,
      });
    }

    if (!link.startsWith('https') && play.yt_validate(link) !== 'video') {
      let msg: InteractionResponse<boolean>;
      try {
        const search = await play.search(link, { limit: 5 });

        msg = await interaction.reply({
          content: '🔍 | Searching...',
          ephemeral: true,
          embeds: [makeEmbedResponse(search)],
          components: [makeButton(search)],
        });
      } catch (error) {
        return await interaction.reply({
          content: '❌ | Bad search query.',
          ephemeral: true,
        });
      }

      let ytURL: string;
      try {
        const confirmation = await msg
          .awaitMessageComponent({
            filter: (i) => i.user.id === interaction.user.id,
            time: AWAIT_TIME_FOR_RESPONSE,
          })
          .finally(() => msg.delete());
        ytURL = confirmation.customId;
      } catch (_) {
        return await interaction.editReply({
          content: '❌ | You did not select a song in time.',
          embeds: [],
          components: [],
        });
      }

      await this.playSong(interaction, ytURL);
    } else {
      await interaction.reply({
        content: '🔍 | Searching...',
        ephemeral: true,
      });
      const result = await this.checkSong(link);

      switch (result) {
        case 'age':
          return await interaction.editReply({
            content: '❌ | Video is age restricted.',
          });
        case 'invalid':
          return await interaction.editReply({
            content: '❌ | Invalid YouTube video URL.',
          });
      }

      await interaction.deleteReply();

      await this.playSong(interaction, link);
    }
  }

  private async checkSong(link: string): Promise<string> {
    try {
      await play.video_info(link);
      return link;
    } catch (error) {
      if (error instanceof Error && error.message.includes('age')) {
        return 'age';
      }
      return 'invalid';
    }
  }
}
