import { Message } from "discord.js"
import { Command, CommandArgs, WorkDir } from "../core"
import Utils from "../core/Utils";
import { FFmpegArgs } from "../media";
import { COLOR_ARGS_USAGE } from "../core/Constants";

async function execute(msg: Message, args: CommandArgs): Promise<void | WorkDir> {
    let width = args.checkInteger(0);
    if (width <= 0) throw "Invalid width.";
    let height = args.checkInteger(1);
    if (height <= 0) throw "Invalid height";

    if (width * height > 1280 * 720)
        throw "Resolution too large.";

    let size = `${width}x${height}`;
    let color = Utils.parseColorArgs(args, 2);

    let duration = 0;
    if (args.has(6)) {
        duration = args.checkTimestamp(6);
        if (duration < 0 || duration > 30)
            throw "Duration out of range.";
    }

    return await Utils.createProcessMediaTask(undefined, msg, (workDir: WorkDir): FFmpegArgs => {
        let args = new FFmpegArgs([{
            type: "lavfi",
            path: {
                name: "color",
                options: { size, color, duration: (duration ? duration : 1).toString() }
            }
        }]);

        args.rawExec = true;
        if (duration == 0) args.output.frames = 1;
        args.output.directory = workDir.path;
        args.output.format = (duration > 0) ? "mp4" : "png";

        return args;
    });
}

export const blankimage: Command = {
    execute: execute,
    
    usage: [
        {name: "width", type: "number", required: true,
         desc: "Cannot be smaller than 0."},
        {name: "height", type: "number", required: true,
         desc: "Cannot be smaller than 0."},
        ...COLOR_ARGS_USAGE,
        {name: "duration", type: "timestamp", required: false,
         desc: "If duration is larger than 0, the output file will be a video."}
    ],
    shortDesc: "Generate a blank rectangular image/video with a uniform color",
    desc: "Max size is 1280x720, max duration is 30 seconds.",
    aliases: ["rect", "genrect", "blankrect", "blank", "blankvideo"]
}