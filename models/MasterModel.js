exports.model = {
    activeTraders: new Map(),
    isLoaded: false,
    BinanceServerTimeDiff: 0,
    listenKey: undefined,
    IsStreamsReady: false,
    isPrice24hReady: false,
    IsReady1d: false,
    IsWalletStreamOk: false,
    IsKlinesStreamOk: false,
    IsPriceChangeStreamOk: false,
    // WalletStream: undefined,
    Wallet: undefined,
    balalnces_KV: {},
    Orders: [],
    PriceChanges24hr: undefined,
    KlineStream: undefined,
    KlineStream1d: undefined,
    Klines: new Map(),
    Klines1d: new Map(),
    Klines4h: new Map(),

    Stocks: {},
    symbols: [],
    tmp_symbols: [],
    tradersInAction: 0,
    AssetsToTrade: {},
    
}