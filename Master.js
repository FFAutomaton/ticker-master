const Binance = require('./services/binance')
const Streams = require('./services/streams');
const Constants = require("./constants");
let MasterModel = require('./models/MasterModel');
const EasyHelpers = require('./helpers/easy_helper');
const createCsvWriter = require('csv-writer').createArrayCsvWriter;
const fs = require('fs');


module.exports = class Master {
    constructor() {
        for (let key in MasterModel.model) {
            this[key] = MasterModel.model[key];
        }
    }

    async writeToFile(symbol_name, data, tickSize, fileUpdateTs) {
        let filePath = `data/${symbol_name}_${Constants.TICKERDURATION}_${EasyHelpers.countDecimals(tickSize)}_${fileUpdateTs}.csv`
        let prevFilePath = `data/${symbol_name}_${Constants.TICKERDURATION}_${EasyHelpers.countDecimals(tickSize)}_${fileUpdateTs - Constants.TICKERDURATION * 60 * 1000}.csv`
        fs.unlinkSync(prevFilePath);

        const csvWriter = createCsvWriter({
            path: filePath,
            header: ["atr"]
        });
        data = data.filter(function () { return true; });
        data = data.map(item => [item])

        csvWriter.writeRecords(data)
            .then(() => {
                console.log(`${symbol_name}...Done`);
            });
    }

    async startApp() {
        if (this.IsStreamReady) {
            clearInterval(this.startAppFunction);
            console.log('.............. startApp is running!');
            // Streams.wallet.bind(this)();
            await this.run();
            // this.MonitorMainFunction = setInterval(this.run.bind(this), Constants.TICKERDURATION * 60 * 1000);  // BU COLLECTOR RUN METHODUNUN INTERVAL DEGERIDIR!
            this.BinanceServerTimeFunction = setInterval(Binance.checkServerTime.bind(this), 2 * 60 * 1000);
            this.keepAliveListenKeyFunction = setInterval(Binance.keepAliveListenKey.bind(this), 30 * 60 * 1000);
            // this.getKlines1dRestFunction = setInterval(Binance.getKlines1dRest.bind(this), 60 * 60 * 1000);
            // this.binanceGetKlines4hRestFunction = setInterval(Binance.binanceGetKlines4hRest.bind(this), 30 * 60 * 1000);
        }
    } 

    async build() {
        // this.startAppFunction = setInterval(this.startApp.bind(this), 1 * 3 * 1000);
        Streams.combinedKline.bind(this)();
    }

    filterCandleSchema(new_klines) {
        let tmp = []
        for (let index = 0; index < new_klines.length; index++) {
            let row = []
            for (let c = 0; c < Constants.csvHeader.length; c++) {
                row.push(new_klines[index][c])
            }
            tmp.push(row)
        }
        return tmp
    }
}