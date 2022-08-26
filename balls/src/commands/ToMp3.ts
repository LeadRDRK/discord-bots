import { Message } from "discord.js"
import { Command, CommandArgs, CommandInputs, WorkDir } from "../core"
import Utils from "../core/Utils";
import { FFmpegArgs, InputType, MediaInfo } from "../media";

async function execute(msg: Message, _: CommandArgs, inputs: CommandInputs): Promise<void | WorkDir> {
    return await Utils.createProcessMediaTask(inputs, msg, (workDir: WorkDir, medias: MediaInfo[]): FFmpegArgs => {
        let media = medias[0];
        if (!media.audio)
            throw "No audio stream detected.";
        
        let args = new FFmpegArgs([{path: media.path}]);
        args.rawExec = true;
        args.output.directory = workDir.path;
        args.output.format = "mp3";

        return args;
    });
}

export const tomp3: Command = {
    execute: execute,
    parseOptions: {
        inputCount: 1,
        inputTypes: InputType.VIDEO | InputType.AUDIO
    },
    
    usage: [],
    shortDesc: "Convert a video/audio file to a MP3",
    desc: "The file is encoded as MP3 V0 (variable bitrate, close to 320kbps)",
    aliases: ["mp3"]
}