module.exports = {
    TICKERDURATION: 5,
    volatilityThreshold: 2,
    csvHeader: ["open_ts", "open", "high", "low", "close", "volume", "close_ts"],
    // csvHeader: ["atr"],
    debugBTC: "USDT",
    upDown: ["UPUSDT", "DOWNUSDT"],
    // debugSymbols: ["LINKUSDT", "ALGOUSDT", "XRPUSDT"],
    // debugSymbols: ["XRPUSDT"],
    debugSymbols: [], // if empty it will get all pairs from exchangeInfo
    discardAssets: [
        "BTCDOM", "USDC", "SRM", "BTS", "TUSDT"
    ],
    atrWindow: 14,

    closePlace: 4, //1 open, 2 high, 3 Low, 4 closed - mum fiyatları
    volumePlace: 5,

    kCount: 100,
 };