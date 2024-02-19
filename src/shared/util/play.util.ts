import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from 'discord.js';
import * as play from 'play-dl';

export const makeButton = (search: play.YouTubeVideo[]) => {
  const buttons: ActionRowBuilder<ButtonBuilder> = new ActionRowBuilder();
  for (let i = 0; i < search.length; i++) {
    const button = new ButtonBuilder()
      .setCustomId(search[i].url)
      .setLabel(String(i + 1))
      .setStyle(ButtonStyle.Primary);
    buttons.addComponents(button);
  }
  return buttons;
};

export const makeEmbedFields = (search: play.YouTubeVideo[]) => {
  const fields = [];
  for (let i = 0; i < search.length; i++) {
    fields.push({
      name: `${i + 1}. ${search[i].title}`,
      value: search[i].url,
    });
  }
  return fields;
};

export const makeEmbedResponse = (search: play.YouTubeVideo[]) => {
  const embed = new EmbedBuilder()
    .setTitle('Search results')
    .setAuthor({ name: 'Rusich bot' })
    .setFields(makeEmbedFields(search));
  return embed;
};
