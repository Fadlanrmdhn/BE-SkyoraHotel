const { response } = require("express");

module.exports = {
    //key object yang akan dipanggil pas export/require di file lain
    response: (status, message, data) => {
        if(data) {
            //kalau responsenya ada data
            return {
                status: status,
                message: message,
                data:data
            }
        }else{
            //kalau response nggak ada data (misal error) hasil di postmannya jangan kirim key data id jsonnya
            return {
                status:status,
                message:message
            }
        }
    }
}