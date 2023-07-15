const Binance = require('../services/binance')
const Constants = require('../constants');


exports.filterDebugSymbols = function() {
    // if (Constants.debugSymbols.length == 0) { return; }
    let tempSymbols = this.symbols;
    let symbols = [];
    
    for (let index = 0; index < tempSymbols.length; index++) {
        let baseAsset = tempSymbols[index].baseAsset;
        let symbol = tempSymbols[index].symbol;

        if(Constants.debugSymbols.length == 0) {
            if (!Constants.discardAssets.includes(baseAsset) && symbol.endsWith("USDT")) {
                symbols.push(tempSymbols[index]) 
            }
        } else {
            if (Constants.debugSymbols.includes(symbol) || tempSymbols[index].balance) { symbols.push(tempSymbols[index]) }
        }
    }
    this.symbols = symbols;
}

exports.filterSymbolsToKeyValue = (symbols) => {
    let Stocks = {};
    for (let i = 0; i < symbols.length; i++) {
        Stocks[symbols[i].symbol] = {
            "symbol": symbols[i].symbol,
            "lastBuyOrder": symbols[i].lastBuyOrder,
            "lastSellOrder": symbols[i].lastSellOrder,
            "baseAsset": symbols[i].baseAsset,
            "quoteAsset": symbols[i].quoteAsset,
            "minLotSize": symbols[i].filters.filter(el => el.filterType === 'LOT_SIZE')[0].minQty,
            "stepSize": symbols[i].filters[2].stepSize,
            "tickSize": symbols[i].filters[0].tickSize,
            "stepSize": symbols[i].filters[2].stepSize,
            "minQty": symbols[i].filters[2].minQty,
            "minNotional": symbols[i].filters[3].minNotional,
            "avgPriceMins": symbols[i].filters[1].multiplierUp,
            "multiplierDown": symbols[i].filters[1].multiplierUp,
            "multiplierUp": symbols[i].filters[1].multiplierUp,
        }
    }
    return Stocks;
}
