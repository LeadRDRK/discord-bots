import { Message } from "discord.js"
import { Command, CommandArgs, CommandInputs, WorkDir } from "../core"
import Utils from "../core/Utils";
import { FFmpegArgs, FFmpegFilterGraph, InputType, MediaInfo, ASSBuilder, ASSStyle, ASSEvent } from "../media";

async function execute(msg: Message, args: CommandArgs, inputs: CommandInputs): Promise<void | WorkDir> {
    let splitArgs = args.split();

    return await Utils.createProcessMediaTask(inputs, msg, async (workDir: WorkDir, medias: MediaInfo[]): Promise<FFmpegArgs> => {
        let media = medias[0];
        if (!media.video)
            throw "No video stream detected.";
        
        let args = new FFmpegArgs([{path: media.path}]);
        args.copyAudio = true;

        let mWidth = media.video.width;
        let mHeight = media.video.height;

        let ass = new ASSBuilder;
        ass.info.playResX = mWidth;
        ass.info.playResY = mHeight;
        // Add "Default" style
        ass.styles.push(new ASSStyle);

        // Scale font size
        let ratio = (mWidth * mHeight) / (640 * 480);
        ass.styles[0].fontSize *= ratio;

        let i = 0;
        for (const args of splitArgs) {
            if (args.length < 1)
                throw "Missing arguments.";
            
            let text = args.getString(0);
            let start = 0, duration = 0;
            if (args.has(1)) start = args.checkTimestamp(1);
            if (args.has(2)) duration = args.checkTimestamp(2);

            [start, duration] = Utils.checkStartDuration(start, duration, media.duration);

            let event = new ASSEvent;
            event.layer = i;
            event.start = start;
            event.end = start + duration;
            event.text = text;
            ass.events.push(event);

            ++i;
        }

        let assFile = await ass.writeFile(workDir.path);
        args.filterGraph = new FFmpegFilterGraph([{
            name: "subtitles",
            options: {
                filename: assFile,
                fontsdir: "./assets/fonts",
                alpha: "1"
            }
        }]);

        args.output.directory = workDir.path;
        args.output.format = Utils.getOutputFormat(media.path);

        return args;
    });
}

export const addtext: Command = {
    execute: execute,
    parseOptions: {
        inputCount: 1,
        inputTypes: InputType.VIDEO | InputType.IMAGE | InputType.AIMAGE
    },
    
    usage: [
        {name: "text", type: "string", required: true,
         desc: "The text to be added onto the image. Supports style override codes; check the documentation for more info."},
        {name: "start time", type: "timestamp", required: false,
         desc: "The time for the text to appear. If the value is negative, it will start from the end. Default: 0"},
        {name: "duration", type: "timestamp", required: false,
         desc: "How long the text should stay on screen. If the value is 0, it'll stay there for the rest of the video. " +
               "Can also be negative which makes it offset back relative to the start time. Default: 0"}
    ],
    vaArgs: "|",
    shortDesc: "Add 1 text or more onto the image",
    desc: "Note that text styling (fonts, size, etc.) is available through the use of Style override codes. Check " +
          "the documentation for more info. The default text size is based on the video's resolution.",
}