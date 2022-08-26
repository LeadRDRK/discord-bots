import { Message } from "discord.js"
import { Command, CommandArgs, CommandInputs, WorkDir } from "../core"
import Utils from "../core/Utils";
import { FFmpegArgs, FFmpegFilterGraph, InputType, MediaInfo } from "../media";

async function execute(msg: Message, args: CommandArgs, inputs: CommandInputs): Promise<void | WorkDir> {
    let frequency = 5, depth = 0.5;
    if (args.has(0)) {
        frequency = args.checkNumber(0);
        if (frequency < 0.1 || frequency > 20000) {
            throw "Invalid frequency.";
        }
    }

    if (args.has(1)) {
        depth = args.checkNumber(1);
        if (depth < 0 || depth > 100) {
            throw "Invalid depth percentage.";
        }
        depth /= 100;
    }

    return await Utils.createProcessMediaTask(inputs, msg, (workDir: WorkDir, medias: MediaInfo[]): FFmpegArgs => {
        let media = medias[0];
        if (!media.audio)
            throw "No audio stream detected.";

        let args = new FFmpegArgs([{path: media.path}]);
        args.filterGraph = new FFmpegFilterGraph([{
            name: "vibrato",
            options: {
                f: frequency.toString(),
                d: depth.toString()
            }
        }]);
        args.copyVideo = true;
        args.output.directory = workDir.path;
        args.output.format = Utils.getExtension(media.path);

        return args;
    });
}

export const vibrato: Command = {
    execute: execute,
    parseOptions: {
        inputCount: 1,
        inputTypes: InputType.VIDEO | InputType.AUDIO
    },
    
    usage: [
        {name: "frequency", type: "number", required: false,
         desc: "The modulation frequency in Hz. Ranges from 0.1 to 20000. Default: 5"},
        {name: "depth", type: "number", required: false,
         desc: "Depth of modulation as a percentage. Ranges from 0 to 100. Default: 50"}
    ],
    shortDesc: "Apply vibrato on audio",
    desc: "Tip: Use 1000 as the frequency for some ear deafening effects."
}