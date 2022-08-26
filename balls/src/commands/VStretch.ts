import { Message } from "discord.js"
import { Command, CommandArgs, CommandInputs, WorkDir } from "../core"
import { InputType } from "../media";
import { stretch } from "./Stretch";

async function execute(msg: Message, args: CommandArgs, inputs: CommandInputs): Promise<void | WorkDir> {
    args.unshift("vertical");
    return await stretch.execute(msg, args, inputs);
}

export const vstretch: Command = {
    execute: execute,
    parseOptions: {
        inputCount: 1,
        inputTypes: InputType.VIDEO | InputType.IMAGE | InputType.AIMAGE
    },
    
    usage: [
        {name: "multiplier", type: "number", required: false,
         desc: "The dimension multiplier. Default: 2. Cannot be 1 or smaller than or equal to 0."},
    ],
    shortDesc: "Alias for `-stretch vertical [multiplier]`"
}