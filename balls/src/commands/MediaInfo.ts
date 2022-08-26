import { Message, MessageEmbed } from "discord.js"
import { InputType } from "../media/InputType";
import { Command, CommandArgs, CommandInputs } from "../core"
import { TaskManager, WorkDir, InputFetcher } from "../core";
import { FFmpeg, MediaInfo } from "../media";

function bitrateStr(bitrate: number) {
    return isNaN(bitrate) ? "N/A" : bitrate + " kb/s";
}

function numberStr(num: number) {
    return isNaN(num) ? "N/A" : num.toString();
}

function createInfoEmbed(info: MediaInfo): MessageEmbed {
    let embed = new MessageEmbed;
    embed.setColor("ORANGE")
         .setTitle("Media Info");
    let overallInfo = `Duration: ${isNaN(info.duration) ? "N/A" : info.duration + "s"}\n` +
                      `Bitrate: ${bitrateStr(info.bitrate)}\n`

    let streamNum = 0;
    let videoInfo: string | undefined;
    if (info.video) {
        videoInfo = `Width: ${numberStr(info.video.width)}
Height: ${numberStr(info.video.height)}
Bitrate: ${bitrateStr(info.video.bitrate)}
FPS: ${numberStr(info.video.fps)}
Codec: ${info.video.codec}`;
        ++streamNum;
    }

    let audioInfo: string | undefined;
    if (info.audio) {
        audioInfo = `Sample Rate: ${info.audio.sampleRate + "Hz"}
Bitrate: ${bitrateStr(info.audio.bitrate)}
Channels: ${info.audio.channels}
Codec: ${info.audio.codec}`;
    }

    if (info.selfEncoded)
        embed.setDescription("* This file was made with balls.");

    embed.addField("Overall", overallInfo)
    if (videoInfo) embed.addField("Video", videoInfo);
    if (audioInfo) embed.addField("Audio", audioInfo);
    embed.setFooter({text: '* Tip: You can use these values in scripts using the "media" table'});
    return embed;
}

async function execute(msg: Message, _: CommandArgs, inputs: CommandInputs): Promise<void | WorkDir> {
    if (inputs.length == 0) {
        msg.reply("No input file provided.");
        return;
    }

    let workDir = await TaskManager.createWorkDir();
    await InputFetcher.downloadInputFiles(inputs, workDir);
    let info = await FFmpeg.getMediaInfo(inputs, msg.author.id);
    msg.reply({embeds: [createInfoEmbed(info[0])]});

    return workDir;
}

export const mediainfo: Command = {
    execute: execute,
    parseOptions: {
        inputCount: 1,
        inputTypes: InputType.ALL
    },
    
    usage: [],
    shortDesc: "Query information about a media file"
}