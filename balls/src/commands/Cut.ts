import { Message } from "discord.js"
import { Command, CommandArgs, CommandInputs, WorkDir } from "../core"
import Utils from "../core/Utils";
import { FFmpegArgs, InputType, MediaInfo } from "../media";

async function execute(msg: Message, args: CommandArgs, inputs: CommandInputs): Promise<void | WorkDir> {
    let start = args.checkTimestamp(0);
    let duration = 0;
    if (args.has(1)) duration = args.checkTimestamp(1);
    // Duration might be undefined (which is allowed)

    return await Utils.createProcessMediaTask(inputs, msg, (workDir: WorkDir, medias: MediaInfo[]): FFmpegArgs => {
        let media = medias[0];
        [start, duration] = Utils.checkStartDuration(start, duration, media.duration);

        let args = new FFmpegArgs([{path: media.path, start, duration}]);
        if (start == 0 || !media.video) {
            // Cutting without re-encoding video from a different start pos might cause
            // some unwanted stuff
            args.copyVideo = args.copyAudio = true;
        }

        args.output.directory = workDir.path;
        args.output.format = Utils.getOutputFormat(media.path);

        return args;
    });
}

export const cut: Command = {
    execute: execute,
    parseOptions: {
        inputCount: 1,
        inputTypes: InputType.VIDEO | InputType.AUDIO | InputType.AIMAGE
    },
    
    usage: [
        {name: "start time", type: "timestamp", required: true,
         desc: "Time to start cutting from. If the value is negative, it will start from the end."},
        {name: "duration",   type: "timestamp", required: false,
         desc: "Duration of the cut. If not specified, it will cut till the end. Can also be negative which makes it " +
               "offset back relative to the start time."},
    ],
    shortDesc: "Cut/trim a video or an audio file",
    aliases: ["trim"]
}