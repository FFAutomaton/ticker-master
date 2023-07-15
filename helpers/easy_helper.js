module.exports = class EasyHelpers {
    static round_amount(value, decimals) {
        return parseFloat(parseFloat(value).toFixed(decimals));
    }

    static round_dust(value, decimals) {
        return parseFloat(parseFloat(value).toFixed(decimals))
    }

    static countDecimalFromPrice(price) {
        let decs = price.split(".")
        let length = decs[1].length
        return length
    }

    static countDecimals(text) {
        try{
            let zero_index = text.indexOf("0")
            let one_index = text.indexOf("1")
            return one_index == 0 ? 0 : one_index - zero_index - 1
        } catch (err) {
            console.log(`countDecimal func err: ${err}`)
        }
    }

    static sleep(ms) {
        return new Promise(resolve => {
            setTimeout(resolve, ms)
        })
    }

    static getHumanReadebleTime(unixTS=undefined) {
        let date_ob = undefined
        if (unixTS) {
            date_ob = new Date(unixTS);
        } else {
            date_ob = new Date();
        }
        let date = ("0" + date_ob.getDate()).slice(-2);
        let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
        let year = date_ob.getFullYear();
        let hours = date_ob.getHours();
        let minutes = date_ob.getMinutes();
        let seconds = date_ob.getSeconds();
        return year + "-" + month + "-" + date + " " + hours + ":" + minutes + ":" + seconds;
    }
}