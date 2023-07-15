const https = require('https');
const crypto = require('crypto');
const { BinanceApiKey, BinanceApiSecret } = require('../keys');
const Constants = require('../constants');
const EasyHelpers = require('../helpers/easy_helper')


module.exports = class Binance {
    static async createMarketBuy(symbol) {
        if (Constants.justLogBuys) {
            console.log(`${this.ActiveSymbol} - ${EasyHelpers.getHumanReadebleTime()} - BUY - quantity: ${this.orderQuantity} price: ${this.ClosedPrice}`)
            return;
        }
        if (this.master.tradersInAction > Constants.activeTradeLimit) {
            console.log(`${this.ActiveSymbol} ....Trade action is full waiting....`)
            this.ListenForSaleOrder = false;
            return;
        }
        this.master.IsWalletReady = false;
        let data = await Binance.sendRequest("POST", "/api/v3/order", { symbol, side: "BUY", type: "MARKET", quantity: this.orderQuantity, timestamp: Date.now() + this.BinanceServerTimeDiff })
        const dataJSON = JSON.parse(data);
        
        if (dataJSON.code) {
            this.master.IsWalletReady = true;
            // TODO:: create custom exeptions to handle in the meta processes
            console.error(`createMarketBuy error: ${JSON.stringify(dataJSON)}`);
            return
        }
        console.log(`${this.ActiveSymbol}-****BUY****BUY*** - quantity: ${parseFloat(this.orderQuantity).toFixed(4)} price: ${this.ClosedPrice}`)
        this.lastBuyOrder = dataJSON;
        this.openOrder = undefined;
    }

    static async clearHand() {
        this.master.IsWalletReady = false;
        this.ListenForSaleOrder = false;

        let free = parseFloat(this.master.balances_KV[this.id].free);
        if (free == 0) return;

        let minLotSize = this.symbol.minLotSize;
        let orderValue = EasyHelpers.round_amount(free, EasyHelpers.countDecimals(minLotSize));
        let exitData = await Binance.marketExit(this.ActiveSymbol, orderValue, this.BinanceServerTimeDiff);
        console.log(`clearHand function working for ${this.ActiveSymbol}. Exit data: ${JSON.stringify(exitData)}`);


        if (exitData.code == undefined && exitData.orderId > 0) {
            console.log('clear Hand working!!')
            // kill.bind(this)('clear Hand working!!')
        } else {
            this.master.IsWalletReady = true;
            console.log(`Clear Hand error! ${JSON.stringify(exitData)}`)
        }
    }

    static async createTakeProfitOrder(symbol, quantity, stopPrice, BinanceServerTimeDiff) {
        this.master.IsWalletReady = false;
        let data = await Binance.sendRequest("POST", "/api/v3/order", { symbol, side: "SELL", type: Constants.stopType, timeInForce: "GTC", quantity, price: stopPrice, stopPrice: stopPrice, timestamp: Date.now() + BinanceServerTimeDiff })
        // this.telegram_bot.sendMessage(`${this.ActiveSymbol} - ${EasyHelpers.getHumanReadebleTime()} - stop loss limit created price: ${stopPrice}, quantity: ${quantity} `)

        const dataJSON = JSON.parse(data);
        // this.logger("x", "createStopLossOrder " + data)
        // this.logger("x", "createStopLossOrder " + JSON.stringify(dataJSON))
        if (dataJSON.code == undefined && dataJSON.orderId > 0) {
            return dataJSON;
        }
        this.master.IsWalletReady = true;
        console.error(`stop loss create error, ${JSON.stringify(dataJSON)}`)
        // TODO:: stop loss creation error, handle it
        return undefined
    }

    static async getExchangeInfo() {
        console.log('Master exchangeInfo started!');
        let data = await Binance.binanceGet('/fapi/v1/exchangeInfo')
        let exchangeInfo = JSON.parse(data);
        console.log('Master exchangeInfo started! --> Got the symbols array');
        this.symbols = exchangeInfo.symbols;
    }

    static async checkServerTime() {
        let data = await Binance.binanceGet('/fapi/v1/time')
        let BinanceServerTimeDiff = JSON.parse(data).serverTime - Date.now()
        this.BinanceServerTimeDiff = BinanceServerTimeDiff
        // this.writeTraderLog("Main BinanceServerTimeDiff: " + this.BinanceServerTimeDiff)
    };

    static async createListenKey() {
        try {
            // this.writeTraderLog("1996 - createListenKey çalıştırdım");
            console.log('Creating key for the first time started!');
            let data = await Binance.sendRequest("POST", "/api/v3/userDataStream", { keyExpired: true })
            const dataJSON = JSON.parse(data);
            console.log('Creating key for the first time started! -----> Got the key!!');
            //await // this.writeTraderLog("createListenKey", "," + Date.now() + "," + JSON.stringify(dataJSON[0]))
            this.listenKey = dataJSON.listenKey;
        } catch (error) {
            throw error;
        }
    }

    static async binanceGetKlines4hRest() {
        let klines4h = new Map();
        for (let symbol in this.Stocks) {
            let klines = await Binance.getKline(symbol, "4h", Constants.kCount)
            klines4h.set(symbol, klines);
        }
        this.Klines4h = klines4h;
        console.log("Main called GetKlines4h started! -----> GetKlines4h finished!");
    }
    
    static async getKlines1dRest() {
        let klines1d = new Map();
        for (let symbol in this.Stocks) {
            let klines = await Binance.getKline(symbol, "1d", Constants.kCountSmall)
            klines1d.set(symbol, klines);

        }
        this.Klines1d = klines1d;
        console.log("Main called getKlines1dRest  started! --> Got the 1d candles!!")
    }

    static async keepAliveListenKey() {
        let data = await Binance.sendRequest("PUT", "/api/v3/userDataStream", { listenKey: this.listenKey }, false)
        const dataJSON = JSON.parse(data);
        //await // this.writeTraderLog("createListenKey", "," + Date.now() + "," + JSON.stringify(dataJSON[0]))
        console.log('listenKey KeepAlive Sent!!')
        // this.writeTraderLog('listenKey KeepAlive Sent!!');
        this.listenKey = dataJSON.listenKey;
        return dataJSON.listenKey;
    }

    static async getOrder(symbol, BinanceServerTimeDiff, orderId) {
        // this.TraderLogger.info('776- async binanceGetOrder çalıştırdım');
        // this.TraderLogger.info("Trader " + this.id + " for currency: " + this.ActiveSymbol + " binanceGetOrder" + " with TimeDiff: " + this.master.BinanceServerTimeDiff);
        let args = { symbol, orderId, timestamp: Date.now() + BinanceServerTimeDiff };
        
        let data = await Binance.sendRequest("GET", "/api/v3/order", args)
        let datajson = JSON.parse(data)
        // this.logger("x", "binanceGetOrder " + data)
        // this.logger("x", "binanceGetOrder " + JSON.stringify(datajson))
        let status = false
        if (datajson.status == "FILLED") {
            status = false
            // this.TraderLogger.info('786- async binanceGetOrderda datajson.status FILLED, statusu falsea çektim');
            return { isActive: status, data: datajson }
        }
        status = true
        // this.TraderLogger.info('790- async binanceGetOrderda datajson.status FILLED değil, statusu trueya çektim');       
        return { isActive: status, data: datajson }
        }

    static async getAllOrders(symbol, BinanceServerTimeDiff) {
        // this.TraderLogger.info("Trader " + this.id + " for currency: " + this.ActiveSymbol + " binanceGetAllOrders" + " with TimeDiff: " + this.master.BinanceServerTimeDiff);
        let orders = await Binance.sendRequest("GET", "/api/v3/allOrders", { symbol, timestamp: Date.now() + BinanceServerTimeDiff });
        return JSON.parse(orders);
    }

    static async cancelOrder(symbol, diff, orderId = undefined) {
        this.master.IsWalletReady = false;
        let args = { symbol, timestamp: Date.now() + diff }
        if (orderId) {
            args.orderId = orderId;
        }
        let data = await Binance.sendRequest("DELETE", "/api/v3/openOrders", args);
        let dataJSON = JSON.parse(data)
        if (dataJSON.code) {
            console.error(`${this.ActiveSymbol} ---- error in cancel order ${data}`)
        }
        return dataJSON;
    }
    
    static async marketExit(symbol, quantity, BinanceServerTimeDiff) {
        // this.TraderLogger.info('745-2 - async marketExit çalıştırdım');
        // this.TraderLogger.info("Trader " + this.id + " for currency: " + symbol + "  marketExit" );
        try {
            let data = await this.sendRequest("POST", "/api/v3/order", { symbol, side: "SELL", type: "MARKET", quantity: quantity, timestamp: Date.now() + BinanceServerTimeDiff })
            // let data = await Binance.sendRequest("POST", "/api/v3/order", { symbol: symbol, side: side, type: "LIMIT", timeInForce: "GTC", quantity: quantity, price: price, timestamp: Date.now() + this.master.BinanceServerTimeDiff })
            const dataJSON = JSON.parse(data);
            
            if (dataJSON.orderId != undefined && dataJSON.orderId > 0) {
                this.LastSellOrder = dataJSON
                return dataJSON;
            } else {
                console.error(`############# Market exit failed msg: ${data} for ${symbol} amount: ${quantity} ts: ${Date.now()}`);
                return dataJSON
            }    
        } catch (error) {
            console.error(error);
            return null;
        }
        
    }
    
    static async getKline(symbol, interval, limit) {
        const param = { symbol: symbol, interval: interval, limit: limit }
        let queryString = this.paramSorter(param)
        let data = await this.binanceGet("/fapi/v1/klines?" + queryString)
        const dataJSON = JSON.parse(data);
        return dataJSON;
    }

    static async getAccount_MasterWallet(BinanceServerTimeDiff) {
        // xx.writeTraderLog("2005 - binanceGetAccountMaster çalıştırdım");
        // console.log("Main called binanceGetAccountMaster!")
        let wallet = {}
        let balance = []
        let timeStampParam = Date.now() + BinanceServerTimeDiff
        const data = await this.sendRequest("GET", "/api/v3/account", { timestamp: timeStampParam })
        let dataJSON = JSON.parse(data)
        for (var x in dataJSON.balances) {
            let asset = dataJSON.balances[x].asset;
            let free = dataJSON.balances[x].free;
            let locked = dataJSON.balances[x].locked;
            // console.log(dataJSON.balances[x]);
            if (asset == Constants.debugBTC) {
                wallet.quoteAssetStock = dataJSON.balances[x].free;
            } else if (free != 0 || locked != 0) {
                balance.push({ asset, free, locked });
            }
        }
        wallet.balances = balance;
        wallet.updateTime = dataJSON.updateTime;
        
        return wallet
    }

    static async sendRequest(method, target, param, useSigniture = true) {
        //("POST", "/api/v3/order", { symbol: symbol, side: side, type: "LIMIT", timeInForce: "GTC", quantity: quantity, price: price, timestamp: Date.now() + this.master.BinanceServerTimeDiff })

        const endpoint = "" + target;  // API endpoint
        let options = undefined;
        if (param.keyExpired != true) {
            const queryString = this.paramSorter(param)
            if (useSigniture) {
                const signatureResult = crypto.createHmac('sha256', BinanceApiSecret).update(queryString).digest('hex');
                options = {
                    hostname: 'api.binance.com',
                    port: 443,
                    path: endpoint + "?" + queryString + "&signature=" + signatureResult,
                    method: method,
                    //localaddress: postIP,
                    headers: { 'X-MBX-APIKEY': BinanceApiKey }
                };
            }
            else {
                options = {
                    hostname: 'api.binance.com',
                    port: 443,
                    path: endpoint + "?" + queryString,
                    method: method,
                    //localaddress: postIP,
                    headers: { 'X-MBX-APIKEY': BinanceApiKey }
                };
            }
        }
        else {
            options = {
                hostname: 'api.binance.com',
                port: 443,
                path: endpoint,
                method: method,
                //localaddress: postIP,
                headers: { 'X-MBX-APIKEY': BinanceApiKey }
            };
        }

        // this.writeTraderLog("x", "binance call " + JSON.stringify(options))
        return await this.callAPI(options)
    }

    static callAPI = function(options) {
        // let that = this;
        return new Promise(function (resolve, reject) {

            let ApiData = "";
            let req = https.request(options, function (res) {
                res.setEncoding('utf8');

                res.on('data', function (rawdata) {
                    ApiData += rawdata;
                });
                res.on('end', function () {
                    if (ApiData) {
                        resolve(ApiData);  //         = return dataJSON;
                    } else {
                        resolve(false);
                    }
                });
                req.on('error', function (e) {
                    console.error("!!!!!!!!!! callAPI:" + e + " - " + options + " - " + ApiData);
                    // that.writeTraderLog("error", "callAPI: " + e + " - " + options + " - " + ApiData)
                    reject(e);
                });
            });
            req.end();
            return ApiData;
        });
    }

    static binanceGet(target) {
        const options = {
            hostname: 'fapi.binance.com',
            port: 443,
            path: target,
            method: "GET",
            timeout: 60000
            //,localaddress: getIP
        };
        // await this.writeTraderLog("binanceMainGet", "," + Date.now() + "," + JSON.stringify(options))
        return this.callAPI(options)
    }

    async binancePut(target) {
        const options = {
            hostname: 'api.binance.com',
            port: 443,
            path: target,
            method: "PUT",
            timeout: 60000
            //,localaddress: getIP
        };
        await this.writeTraderLog("binanceMainPut", "," + Date.now() + "," + JSON.stringify(options))

        return this.callAPI(options)
    }

    async binancePost(target) {
        const options = {
            hostname: 'api.binance.com',
            port: 443,
            path: target,
            method: "POST",
            timeout: 60000
            //,localaddress: getIP
        };
        await this.writeTraderLog("binanceMainPost", "," + Date.now() + "," + JSON.stringify(options))

        return this.callAPI(options)
    }

    async binanceDelete(target) {
        const options = {
            hostname: 'api.binance.com',
            port: 443,
            path: target,
            method: "DELETE",
            timeout: 60000
            //,localaddress: getIP
        };
        await this.writeTraderLog("binanceMainDelete", "," + Date.now() + "," + JSON.stringify(options))

        return this.callAPI(options)
    }

    static paramSorter(param) {
        let post_data = '';
        Object.keys(param)
            .sort()
            .forEach(function (v, i) {
                post_data += v + "=" + param[v] + "&";
            });
        return post_data.substr(0, post_data.length - 1);
    }

    static async getCurrentOpenOrders(diff, symbol=undefined) {
        this.ListenForSaleOrder = false
        let params = { timestamp: Date.now() + diff };
        if (symbol) params.symbol = symbol;
        let data = await this.sendRequest("GET", "/api/v3/openOrders", params)
        let dataJSON = JSON.parse(data)
        if (dataJSON.code) {
            console.error(`${this.ActiveSymbol} get Orders error: ${JSON.stringify(dataJSON)}`);
            return undefined;
            // TODO:: create custom exeptions to handle in the meta processes
        }
        return dataJSON;
    }
}