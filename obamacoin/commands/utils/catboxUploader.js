const axios = require("axios").default;
const FormData = require("form-data");
const fs = require("fs");

module.exports = (file, cb) => {
    var formData = new FormData();
    formData.append("reqtype", "fileupload");
    formData.append("fileToUpload", fs.createReadStream(file));
    axios.post("https://catbox.moe/user/api.php", formData, {headers: formData.getHeaders(), maxContentLength: Infinity})
    .then(res => {
        var err;
        if (res.status != 200) err = res.status;
        cb(err, res.data);
    });
}