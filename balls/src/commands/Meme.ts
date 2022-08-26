import { Message } from "discord.js"
import { Command, CommandArgs, CommandInputs, WorkDir } from "../core"
import Utils from "../core/Utils";
import { FFmpegArgs, FFmpegFilterGraph, InputType, MediaInfo, ASSBuilder, ASSStyle, ASSEvent, ASSAlign } from "../media";

let topStyle = new ASSStyle;
topStyle.name = "Top";
topStyle.fontName = "Impact";
topStyle.fontSize = 64;
topStyle.outline = 2;
topStyle.shadow = 0;
topStyle.alignment = ASSAlign.TOP_CENTER;

let bottomStyle = Object.assign(new ASSStyle, topStyle);
bottomStyle.name = "Bottom";
bottomStyle.alignment = ASSAlign.BOTTOM_CENTER;

const styles: ASSStyle[] = [topStyle, bottomStyle];

async function execute(msg: Message, args: CommandArgs, inputs: CommandInputs): Promise<void | WorkDir> {
    if (args.length < 1)
        throw "Missing arguments.";
    
    let topText = args.getString(0);
    let bottomText = "", start = 0, duration = 0, autoCapitalize = true;
    if (args.has(1)) bottomText = args.getString(1);
    if (args.has(2)) autoCapitalize = args.checkBoolean(2);
    if (args.has(3)) start = args.checkTimestamp(3);
    if (args.has(4)) duration = args.checkTimestamp(4);

    if (autoCapitalize) {
        topText = Utils.subTextToUpperCase(topText);
        bottomText = Utils.subTextToUpperCase(bottomText);
    }

    return await Utils.createProcessMediaTask(inputs, msg, async (workDir: WorkDir, medias: MediaInfo[]): Promise<FFmpegArgs> => {
        let media = medias[0];
        if (!media.video)
            throw "No video stream detected.";
        
        [start, duration] = Utils.checkStartDuration(start, duration, media.duration);
        let end = start + duration;
        
        let args = new FFmpegArgs([{path: media.path}]);
        args.copyAudio = true;

        let ass = new ASSBuilder;
        ass.info.playResX = 640;
        ass.info.playResY = 480;
        ass.styles = styles;

        let topEvent = new ASSEvent;
        topEvent.layer = 0;
        topEvent.style = "Top"
        topEvent.start = start;
        topEvent.end = end;
        topEvent.text = topText;

        let bottomEvent = new ASSEvent;
        bottomEvent.layer = 1;
        bottomEvent.style = "Bottom";
        bottomEvent.start = start;
        bottomEvent.end = end;
        bottomEvent.text = bottomText;

        ass.events = [topEvent, bottomEvent];

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

export const meme: Command = {
    execute: execute,
    parseOptions: {
        inputCount: 1,
        inputTypes: InputType.VIDEO | InputType.IMAGE | InputType.AIMAGE
    },
    
    usage: [
        {name: "top text", type: "string", required: true,
         desc: "Supports style override codes; check the documentation for more info. Same for bottom text."},
        {name: "bottom text", type: "string", required: false},
        {name: "auto capitalize", type: "boolean", required: false,
         desc: "Capitalize all words automatically. Default: true"},
        {name: "start time", type: "timestamp", required: false,
         desc: "The time for the text to appear. If the value is negative, it will start from the end. Default: 0"},
        {name: "duration", type: "timestamp", required: false,
         desc: "How long the text should stay on screen. If the value is 0, it'll stay there for the rest of the video. " +
               "Can also be negative which makes it offset back relative to the start time. Default: 0"}
    ],
    vaArgs: "|",
    shortDesc: "Make a top text + bottom text meme",
    desc: "Note: If position/size related style overrides are used, they will be relative to a resolution of 640x480 " +
          "(which is the base resolution that the text scales up from). Default text size is 64.",
}