import { Message } from "discord.js";
import { execFile } from "./ChildProcess";
import { FFmpeg } from "../media";
import Utils from "./Utils";
const LUA_DIST_PATH = "./ballslua/dist";
const LUA_EXEC = LUA_DIST_PATH + "/ballslua";
const LUAEVAL_EXEC = LUA_DIST_PATH + "/ballslua_eval";

// TODO: Implement Lua state persistence

function execLua(file: string, args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
        execFile(file, args, {timeout: 3000}, (err, stdout, stderr) => {
            if (err) {
                if (err.code == 1)
                    reject(`Error while executing script: ${stderr}`);
                else if (err.signal == "SIGTERM")
                    reject("Script timeout");
                else
                    reject(`Internal error occurred while trying to execute script.`);
                return;
            }
            // @ts-ignore
            resolve(stdout);
        });
    });
}

async function run(script: string, init: string): Promise<string> {
    return await execLua(LUA_EXEC, [script, init]);
}

function parseValues(line: string): Array<string> {
    if (line.length == 0) return [];
    return line.split("😵😭🈵😠🎪🤕");
}

async function evalValues(script: string, init: string): Promise<Array<string>> {
    let stdout = await execLua(LUAEVAL_EXEC, [script, init]);
    return parseValues(stdout);
}

const replaceChars: {[key: string]: string} = {
    "\x07": "\\a",
    "\b": "\\b",
    "\f": "\\f",
    "\n": "\\n",
    "\r": "\\n",
    "\t": "\\t",
    "\v": "\\v",
    "\\": "\\\\",
    "\"": "\\\"",
    "\'": "\\'"
}
function escapeLuaString(str: string): string {
    let escaped = "";
    for (let i = 0; i < str.length; ++i) {
        let char = str[i];
        let rchar = replaceChars[char];
        escaped += rchar ? rchar : char;
    }
    return escaped;
}

function serialize(object: any, varName?: string): string {
    let result = "";

    let type = typeof object;
    if (object == null) type = "undefined";
    switch (type)
    {
    case "string":
        result = `"${escapeLuaString(object)}"`;
        break;

    case "number":
        result = object.toString();
        break;

    case "boolean":
        result = object ? "true" : "false";
        break;

    case "object":
        result += "{";
        if (Array.isArray(object)) {
            object.forEach(value => {
                result += `${serialize(value)},`;
            });
        }
        else {
            Object.entries(object).forEach(value => {
                if (value[0] == "path") return;
                result += `${serialize(value[1], value[0])},`;
            });
        }
        result += "}";
        break;
    
    case "undefined":
        result = "nil";
        break;
    
    default:
        throw `Can't serialize object of type "${type}"`;

    }

    if (varName) result = `${varName}=${result}`;
    return result;
}

function getScriptInit(msg: Message): string {
    let scriptInit = "";
    let messageObj = Utils.createMessageSubset(msg);
    scriptInit += ScriptExecutor.serialize(messageObj, "msg") + "\n";
    let mediaInfo = FFmpeg.getCachedMediaInfo(msg.author.id);
    if (mediaInfo) scriptInit += ScriptExecutor.serialize(mediaInfo[0], "media");
    return scriptInit;
}

const ScriptExecutor = {
    run,
    evalValues,
    serialize,
    getScriptInit
}

export { ScriptExecutor }