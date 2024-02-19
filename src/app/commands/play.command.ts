import { Logger } from 'shared/logger/logger.interface';
import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  GuildMember,
} from 'discord.js';
import {
  createAudioResource,
  createAudioPlayer,
  joinVoiceChannel,
  AudioPlayerStatus,
  VoiceConnectionStatus,
} from '@discordjs/voice';
import { makeButton, makeEmbedResponse } from '../../shared/util/play.util';
import * as play from 'play-dl';
import { VoiceInfo } from 'shared/types/play.type';
import {
  AWAIT_TIME_BEFORE_DISCONNECT,
  AWAIT_TIME_FOR_RESPONSE,
} from './command.const';
import { Command } from './command.interface';
import { inject, injectable } from 'inversify';
import { Component } from '../../shared/types/component.enum';
import { VoiceInfoRepository } from './voice-info.repository';

@injectable()
export class PlayCommand implements Command {
  public _data = new SlashCommandBuilder()
    .setName('play')
    .setDescription('Plays a song via YouTube link, id or search query.')
    .addStringOption((option) =>
      option
        .setName('video')
        .setDescription('YouTube link, id or search query.')
        .setRequired(true)
    )
    .setDMPermission(false);

  constructor(
    @inject(Component.VoiceInfoRepository)
    private readonly voiceInfoRepository: VoiceInfoRepository,
    @inject(Component.Logger) private readonly logger: Logger
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
    link: string,
    info: VoiceInfo
  ) => {
    try {
      if (info.firstPlay) {
        const audio = await play.stream(link);

        const resource = createAudioResource(audio.stream, {
          inputType: audio.type,
        });

        info.player.play(resource);
        info.connection.subscribe(info.player);

        await interaction.followUp(
          `Now playing:\n${(await play.video_info(link)).video_details.url}`
        );

        info.firstPlay = false;
      } else {
        info.queue.push(link);

        await interaction.followUp(
          `Added to queue:\n${(await play.video_info(link)).video_details.url}`
        );
      }
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes('Sign in to confirm your age')
      ) {
        this.logger.error(error, 'PlayCommand');
        await interaction.followUp(
          'Sorry, I cannot play this video because it requires age confirmation.'
        );
      } else {
        this.logger.error(error as Error, 'PlayCommand');
      }
    }
  };

  private handlePlayerIdle = (info: VoiceInfo) => {
    if (info.queue.length > 0) {
      const name = info.queue.shift();

      if (!name) {
        return;
      }

      play.stream(name).then((stream) => {
        const resource = createAudioResource(stream.stream, {
          inputType: stream.type,
        });
        info.player.play(resource);
      });
    } else {
      info.firstPlay = true;

      setTimeout(() => {
        if (info.player.state.status !== AudioPlayerStatus.Idle) {
          return;
        }
        if (
          info.connection.state.status !== VoiceConnectionStatus.Destroyed &&
          info.connection.state.status !== VoiceConnectionStatus.Disconnected
        ) {
          info.connection.destroy();
        }
        info.isBotConnected = false;
      }, AWAIT_TIME_BEFORE_DISCONNECT);
    }
  };

  public async execute(interaction: ChatInputCommandInteraction) {
    const guildId = interaction.guildId;

    if (!interaction.member) {
      this.logger.warn('You must be in a guild to use this command.');
      return await interaction.reply(
        'You must be in a guild to use this command.'
      );
    }

    if (!guildId) {
      this.logger.warn('An error occurred while executing this command.');
      return await interaction.reply(
        'An error occurred while executing this command.'
      );
    }

    const voiceChannel = (interaction.member as GuildMember).voice.channel;

    if (!voiceChannel) {
      this.logger.warn('You must be in a voice channel to use this command.');
      return await interaction.reply(
        'You must be in a voice channel to use this command.'
      );
    }

    if (voiceChannel.joinable === false) {
      this.logger.warn('I do not have permission to join this voice channel.');
      return await interaction.reply(
        'I do not have permission to join this voice channel.'
      );
    }

    if (!interaction.guild || !interaction.guildId) {
      this.logger.warn('You must be in a chanel to use this command.');
      return await interaction.reply(
        'You must be in a chanel to use this command.'
      );
    }

    if (!(guildId in this.voiceInfoRepository.getAll())) {
      this.voiceInfoRepository.add(guildId, {
        player: createAudioPlayer(),
        connection: joinVoiceChannel({
          channelId: voiceChannel.id,
          guildId: interaction.guildId,
          adapterCreator: interaction.guild.voiceAdapterCreator,
        }),
        firstPlay: true,
        firstInit: true,
        isBotConnected: false,
        queue: [],
      });
    }

    const info = this.voiceInfoRepository.get(guildId);

    if (!info) {
      this.logger.warn('An error occurred while executing this command.');
      return await interaction.reply(
        'An error occurred while executing this command.'
      );
    }

    if (!info.isBotConnected) {
      info.connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: interaction.guildId,
        adapterCreator: interaction.guild.voiceAdapterCreator,
      });

      if (info.firstInit) {
        info.connection.on(VoiceConnectionStatus.Disconnected, () => {
          info.queue.length = 0;
          info.isBotConnected = false;
          info.player.stop(true);
        });

        info.player.on(AudioPlayerStatus.Idle, () =>
          this.handlePlayerIdle(info)
        );
        info.firstInit = false;
      }
      info.isBotConnected = true;
    }

    try {
      let link = interaction.options.getString('video');

      await interaction.reply('Searching...');

      if (!link) {
        return await interaction.editReply('Invalid YouTube video URL.');
      }

      if (play.yt_validate(link) !== 'video' && link.startsWith('http')) {
        return await interaction.editReply('Invalid YouTube video URL.');
      } else if (
        play.yt_validate(link) !== 'video' &&
        !link.startsWith('http')
      ) {
        const search = await play.search(link, { limit: 5 });
        if (search) {
          const response = await interaction.editReply({
            content: '',
            embeds: [makeEmbedResponse(search)],
            components: [makeButton(search)],
          });
          try {
            const confirmation = await response.awaitMessageComponent({
              filter: (i) => i.user.id === interaction.user.id,
              time: AWAIT_TIME_FOR_RESPONSE,
            });
            link = confirmation.customId;
          } catch {
            return await interaction.deleteReply();
          }
        } else {
          return await interaction.editReply('No results found.');
        }
      } else {
        try {
          await play.video_info(link);
        } catch (error) {
          return await interaction.editReply('Invalid YouTube video ID.');
        }
      }

      await interaction.deleteReply();
      this.playSong(interaction, link, info);
    } catch (error) {
      this.logger.error(error as Error, 'PlayCommand');
      await interaction.editReply('An error occurred while playing the song.');
    }
  }
}
