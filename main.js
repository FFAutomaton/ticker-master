// 'use strict';
process.env.UV_THREADPOOL_SIZE = 1024;
const Master = require('./Master');
const Binance = require('./services/binance');
const { filterDebugSymbols, filterSymbolsToKeyValue } = require('./helpers/master_helper');


(async () => {
    try {
        let xx = new Master();
        await Binance.checkServerTime.bind(xx)();
        // xx.Wallet = await Binance.getAccount_MasterWallet(xx.BinanceServerTimeDiff);
        await Binance.getExchangeInfo.bind(xx)();

        filterDebugSymbols.bind(xx)();
        xx.Stocks = filterSymbolsToKeyValue(xx.symbols);
        await Binance.createListenKey.bind(xx)();
        // await Binance.getKlines1dRest.bind(xx)();
        // await Binance.binanceGetKlines4hRest.bind(xx)();
        xx.build();
    } catch (err) {
        console.log(err);
    }
})();
