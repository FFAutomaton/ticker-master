const Constants = require("../constants");
const { create, all, parse, abs } = require('mathjs')
const math = create(all)
const EasyHelpers = require("../helpers/easy_helper");


exports.ATR = function (counter, ticker, tickSize) {
    let ATR = []
    let jEnd = (ticker.length - counter)

    for (let j = 0; j <= jEnd; j++) {
        let tarValue = 0
        let iStart = ticker.length - counter - j
        let iEnd = ticker.length - j
        for (let i = iStart; i < iEnd; i++) {
            let highest = parseFloat(ticker[i][2])
            let lowest = parseFloat(ticker[i][3])
            let val = highest - lowest
            tarValue = tarValue + val
        }
        ATR[iEnd - 1] = EasyHelpers.round_dust(tarValue / counter, EasyHelpers.countDecimals(tickSize))

    }
    return ATR
}
