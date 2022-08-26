import { Message } from "discord.js"
import { Command, CommandArgs, CommandInputs, InputFetcher, TaskManager, WorkDir } from "../core"
import Utils from "../core/Utils";
import { InputType } from "../media";
import sharp from "sharp";

async function execute(msg: Message, args: CommandArgs, inputs: CommandInputs): Promise<void | WorkDir> {
    let quality = 1;
    if (args.has(0)) {
        quality = args.checkInteger(0);
        if (quality < 1 || quality > 100) {
            throw "Invalid quality value."
        }
    }

    let workDir = await TaskManager.createWorkDir();
    await InputFetcher.downloadInputFiles(inputs, workDir);
    let image = inputs[0].path!;
    
    let outputPath = workDir.path + "/output.jpeg"
    try {
        await sharp(image)
              .jpeg({quality})
              .toFile(outputPath);
    }
    catch (error) {
        console.log(error);
        throw "Failed to read image data.";
    }

    Utils.replyFile(msg, outputPath);
}

export const tojpeg: Command = {
    execute: execute,
    parseOptions: {
        inputCount: 1,
        inputTypes: InputType.IMAGE
    },
    
    usage: [
        {name: "quality", type: "number", required: false,
         desc: "The JPEG quality. Possible values are numbers starting from 1 to 100. Default: 1"}
    ],
    shortDesc: "Convert an image into a JPEG",
    desc: "For compatibility, the worst quality possible is always used by default. A quality of 80 is good enough for " +
          "most images.",
    aliases: ["jpeg", "tojpg", "jpg"]
}