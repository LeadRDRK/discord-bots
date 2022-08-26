export enum InputType {
    VIDEO  = 1 << 0,
    AUDIO  = 1 << 1,
    IMAGE  = 1 << 2,
    // Animated images (gifs, apngs, etc.) are not included in VIDEO or IMAGE
    AIMAGE = 1 << 3,

    ALL = VIDEO | AUDIO | IMAGE | AIMAGE
}
const inputTypes = Object.keys(InputType).map(x => parseInt(x)).filter(x => !isNaN(x));

const inputFormats: {[key: number]: string[]} = {
    [InputType.VIDEO]:  ["mp4", "webm", "mov", "mkv", "avi", "wmv", "ogv"],
    [InputType.AUDIO]:  ["mp3", "ogg", "oga", "m4a", "wma", "wav", "flac", "aiff", "caf"],
    [InputType.IMAGE]:  ["png", "jpg", "jpeg", "jfif", "bmp"],
    [InputType.AIMAGE]: ["gif"]
};

export function getInputFormats(type: InputType): Array<string> {
    let formats: Array<string> = [];
    inputTypes.forEach(t => {
        if (t in inputFormats && type & t)
            formats.push(...inputFormats[t]);
    });
    return formats;
}

export function getInputType(format: string): InputType | false {
    for (const t of inputTypes) {
        if (t in inputFormats && inputFormats[t].includes(format)) {
            return t;
        }
    }
    return false;
}