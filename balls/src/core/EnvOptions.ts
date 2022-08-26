function get(name: string): string | undefined {
    return process.env[name];
}

let enabledCache: {[key: string]: boolean} = {};
function isEnabled(key: string): boolean {
    if (enabledCache[key] == undefined) {
        let v = process.env[key]?.toLowerCase();
        enabledCache[key] = (v == "1" || v == "true");
    }
    return enabledCache[key];
}

const EnvOptions = {
    get,
    isEnabled
}
export { EnvOptions }