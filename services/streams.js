const WebSocket = require('ws');
const Constants = require('../constants');
const Binance = require('../services/binance')
const { ATR } = require('../brain/indicators')
const os = require('os');


module.exports = class Streams {
    static combinedKline() {
        let newRow = undefined
        // TODO: add candle data into the file
        // TODO: trigger turtle on some conditions
        console.log('Main setupCombinedKlineStream started!');
        let streamUrl = '';
        const selectedSymbols = this.symbols;
        for (let index = 0; index < selectedSymbols.length; index++) {
            streamUrl += selectedSymbols[index].symbol.toLowerCase() + '@kline_' + Constants.TICKERDURATION + 'm/';
        }
        streamUrl = streamUrl.slice(0, -1);
        // this.KlineStream = new WebSocket('wss://stream.binance.com:9443/stream?streams=' + streamUrl);   //btcusdt@kline_15m/ethbtc@kline_15m/bnbbtc@kline_15m');
        this.KlineStream = new WebSocket('wss://fstream.binance.com/stream?streams=' + streamUrl);   //btcusdt@kline_15m/ethbtc@kline_15m/bnbbtc@kline_15m');

        this.KlineStream.on('message', async (data) => {
            let myEvent = JSON.parse(data);
            let symbol_name = myEvent.data.s;
            let thisKline = this.Klines.get(symbol_name);
            let writing = false;
            if (thisKline == undefined) {
                let new_klines = await Binance.getKline(symbol_name, Constants.TICKERDURATION + "m", Constants.kCount)  //TICKER_RANGE DEGERIDIR
                new_klines = this.filterCandleSchema(new_klines)
                this.Klines.set(symbol_name, new_klines);
            } else {
                if (thisKline[thisKline.length - 1][0] == myEvent.data.k.t) {
                    if (myEvent.data.k.x) {
                        thisKline.splice(0, 1);
                    }
                    newRow = [myEvent.data.k.t, myEvent.data.k.o, myEvent.data.k.h, myEvent.data.k.l, myEvent.data.k.c, myEvent.data.k.v, myEvent.data.k.T];
                    thisKline[thisKline.length - 1] = newRow;

                } else {
                    let already_working_traders = await this.read_already_working_traders();
                    
                    let this_price = thisKline[thisKline.length - 1][4]
                    newRow = [myEvent.data.k.t, myEvent.data.k.o, myEvent.data.k.h, myEvent.data.k.l, myEvent.data.k.c, myEvent.data.k.v, myEvent.data.k.T];
                    this.ATR_5m = ATR(Constants.atrWindow, thisKline, this.Stocks[symbol_name].tickSize)
                    let ratio = (this.ATR_5m.slice(-1) / parseFloat(this_price)) * (10000 / 31)

                    if (ratio > Constants.volatilityThreshold || already_working_traders.includes(symbol_name) || Constants.debugSymbols.includes(symbol_name)) {
                        this.writeToFile(symbol_name, this.ATR_5m, thisKline, this.Stocks[symbol_name].quantityPrecision, myEvent.data.k.t - (Constants.TICKERDURATION * 60 * 1000));
                        console.log(os.freemem() / os.totalmem());
                    }
                    thisKline.push(newRow);

                }
                this.Klines.set(symbol_name, thisKline);

                if (!this.IsStreamReady) {
                    console.log('klines symbols count: ' + this.Klines.size)
                    if (this.Klines.size == this.symbols.length) {
                        console.log('symbol count: ' + this.symbols.length)
                        this.IsStreamReady = true;
                    }
                    let difference = this.symbols.filter(x => !Array.from(this.Klines.keys()).includes(x.symbol));
                    
                    console.log('difference: ' + difference.length);
                }
            }
        });

        this.KlineStream.on('error', (data) => {
            let errorMsg = JSON.parse(data)
            console.log('Collector KlinesStream Error Occured: ' + errorMsg);
            this.IsKlinesStreamOk = false;
            this.KlineStream.close();
        })

        this.KlineStream.on('open', (data) => {
            this.IsKlinesStreamOk = true;
            this.KlineStream.isAlive = true;
            console.log('Combined kline web socket opened!');
        });

        this.KlineStream.on('close', async (data) => {
            let closeMsg = JSON.parse(data)
            console.log(`Master !!!!!! Collector KlinesStream Close Occured: ${closeMsg}`);
            this.IsKlinesStreamOk = false;
            console.log('Combined kline web socket closed!');
            await this.reconnectKlineStream();
        });

        this.KlineStream.on('ping', (data) => {
            this.KlineStream.isAlive = true;
            // console.log(`Master setupCombinedKlineStream ping geldi pong gonderdik!`);
        });
    }

}
