import { ImageURLOptions, StaticImageURLOptions } from "discord.js";
import { CommandUsage } from ".";

export const SIMG_URL_OPTIONS: StaticImageURLOptions = {format: "png", size: 512};
export const IMAGE_URL_OPTIONS: ImageURLOptions = {dynamic: true, ...SIMG_URL_OPTIONS};
export const COLOR_ARGS_USAGE: CommandUsage = [
    {name: "r", type: "number", required: false,
     desc: "The red color component (0 - 255). If this is the only value specified and it's a hexadecimal value, " +
           "it will be assumed as a single hex color value in the form of `0xRRGGBBAA` (AA is optional)"},
    {name: "g", type: "number", required: false,
     desc: "The green color component (0 - 255)"},
    {name: "b", type: "number", required: false,
     desc: "The blue color component (0 - 255)"},
    {name: "a", type: "number", required: false,
     desc: "The alpha component (0 - 255). 0 is completely transparent, 255 is completely opaque."},
];
export const PIXELS_LIMIT = 1280*720;
export const PIXELS_LIMIT_MAX = 3000*3000;