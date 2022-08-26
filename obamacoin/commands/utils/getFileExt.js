module.exports = (filename) => {
    return filename.split(".").pop().toLowerCase();
}