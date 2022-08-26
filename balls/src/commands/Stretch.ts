import { Message } from "discord.js"
import { Command, CommandArgs, CommandInputs, WorkDir } from "../core"
import Utils from "../core/Utils";
import { FFmpegArgs, FFmpegFilterGraph, InputType, MediaInfo } from "../media";

type Direction = "horizontal" | "vertical";

async function execute(msg: Message, args: CommandArgs, inputs: CommandInputs): Promise<void | WorkDir> {
    let direction: Direction = "horizontal", multiplier = 2;
    if (args.has(0)) {
        let str = args.getString(0);
        switch (str) {
        case "horizontal":
        case "vertical":
            direction = str;
            break;
        
        case "h":
            direction = "horizontal";
            break;
        
        case "v":
            direction = "vertical";
            break;

        default:
            throw "Invalid direction.";
    
        }
    }

    if (args.has(1)) {
        multiplier = args.checkNumber(1);
        if (multiplier == 1 || multiplier <= 0)
            throw "Invalid multiplier value.";
    }

    return await Utils.createProcessMediaTask(inputs, msg, (workDir: WorkDir, medias: MediaInfo[]): FFmpegArgs => {
        let media = medias[0];
        if (!media.video)
            throw "No video stream detected.";

        let width = media.video.width;
        let height = media.video.height;

        switch (direction) {
        case "horizontal":
            width *= multiplier;
            break;
        
        case "vertical":
            height *= multiplier;
            break;

        }
        
        Utils.checkRes(media, width, height);

        let args = new FFmpegArgs([{path: media.path}]);
        args.noScaling = true;
        args.filterGraph = new FFmpegFilterGraph([{
            name: "scale",
            options: {
                width: width.toString(),
                height: height.toString()
            }
        }])
        args.copyAudio = true;
        args.output.directory = workDir.path;
        args.output.format = Utils.getOutputFormat(media.path);

        return args;
    });
}

export const stretch: Command = {
    execute: execute,
    parseOptions: {
        inputCount: 1,
        inputTypes: InputType.VIDEO | InputType.IMAGE | InputType.AIMAGE
    },
    
    usage: [
        {name: "direction", type: "string", required: false,
         desc: "The direction to scale the image in. Default: `horizontal`. Possible values are: " +
               "`horizontal`, `vertical`, `h`, `v` (h, v are aliases)"},
        {name: "multiplier", type: "number", required: false,
         desc: "The dimension multiplier. Default: 2. Cannot be 1 or smaller than or equal to 0."}
    ],
    shortDesc: "Scale an image in one direction by multiplying it with a multiplier.",
    desc: "This command is similar to `resize`, but it scales relatively and only in one direction. Max size is 1280x720.\n" +
          "See also: `vstretch`, `hstretch`",
}