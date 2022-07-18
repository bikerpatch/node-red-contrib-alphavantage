const helper = require("node-red-node-test-helper")
const avConfig = require("../src/config")
const sinon = require("sinon")
var proxyquire = require("proxyquire").noPreserveCache()

helper.init(require.resolve("node-red"))

var avNode // the module to test
var avApiStub

const RESULT_SUCCESS_COMPACT_15M = {
	"Meta Data": {
		"1. Information": "Intraday (15min) open, high, low, close prices and volume",
		"2. Symbol": "MSFT",
		"3. Last Refreshed": "2022-07-15 20:00:00",
		"4. Interval": "15min",
		"5. Output Size": "Compact",
		"6. Time Zone": "US/Eastern"
	},
	"Time Series (15min)": {
		"2022-07-15 20:00:00": {
			"1. open": "256.8800",
			"2. high": "256.8900",
			"3. low": "256.7900",
			"4. close": "256.7900",
			"5. volume": "1993"
		},
		"2022-07-15 19:45:00": {
			"1. open": "256.8100",
			"2. high": "256.8900",
			"3. low": "256.8000",
			"4. close": "256.8000",
			"5. volume": "1015"
		},
		"2022-07-15 19:30:00": {
			"1. open": "256.7500",
			"2. high": "256.8400",
			"3. low": "256.7500",
			"4. close": "256.8400",
			"5. volume": "1954"
		},
	}
}

const RESULT_POLISH_COMPACT_15M = {
	"meta": {
		"information": "Intraday (15min) open, high, low, close prices and volume",
		"symbol": "MSFT",
		"updated": "2022-07-15 20:00:00",
		"interval": "15min",
		"size": "Compact",
		"zone": "US/Eastern"
	},
	"Time Series (15min)": {
		"2022-07-15T19:00:00.000Z": {
			"open": "256.8800",
			"high": "256.8900",
			"low": "256.7900",
			"close": "256.7900",
			"volume": "1993"
		},
		"2022-07-15T18:45:00.000Z": {
			"open": "256.8100",
			"high": "256.8900",
			"low": "256.8000",
			"close": "256.8000",
			"volume": "1015"
		},
		"2022-07-15T18:30:00.000Z": {
			"open": "256.7500",
			"high": "256.8400",
			"low": "256.7500",
			"close": "256.8400",
			"volume": "1954"
		},
	}
}

const RESULT_SUCCESS_FULL_15M = {
	"Meta Data": {
		"1. Information": "Intraday (15min) open, high, low, close prices and volume",
		"2. Symbol": "MSFT",
		"3. Last Refreshed": "2022-07-15 20:00:00",
		"4. Interval": "15min",
		"5. Output Size": "Full size",
		"6. Time Zone": "US/Eastern"
	},
	"Time Series (15min)": {
		...RESULT_SUCCESS_COMPACT_15M["Time Series (15min)"],
		"2022-07-15 19:15:00": {
			"1. open": "256.7500",
			"2. high": "256.7500",
			"3. low": "256.7500",
			"4. close": "256.7500",
			"5. volume": "103"
		},
	}
}

const RESULT_POLISH_FULL_15M = {
	"meta": {
		"information": "Intraday (15min) open, high, low, close prices and volume",
		"symbol": "MSFT",
		"updated": "2022-07-15 20:00:00",
		"interval": "15min",
		"size": "Full size",
		"zone": "US/Eastern"
	},
	"data": {
		...RESULT_POLISH_COMPACT_15M["data"],
		"2022-07-15T18:15:00.000Z": {
			"open": "256.7500",
			"high": "256.7500",
			"low": "256.7500",
			"close": "256.7500",
			"volume": "103"
		},
	}
}

const RESULT_SUCCESS_COMPACT_30M = {
	"Meta Data": {
		"1. Information": "Intraday (30min) open, high, low, close prices and volume",
		"2. Symbol": "MSFT",
		"3. Last Refreshed": "2022-07-15 20:00:00",
		"4. Interval": "30min",
		"5. Output Size": "Compact",
		"6. Time Zone": "US/Eastern"
	},
	"Time Series (30min)": {
		"2022-07-15 20:00:00": {
			"1. open": "256.8100",
			"2. high": "256.8900",
			"3. low": "256.7900",
			"4. close": "256.7900",
			"5. volume": "3008"
		},
		"2022-07-15 19:30:00": {
			"1. open": "256.7500",
			"2. high": "256.8400",
			"3. low": "256.7500",
			"4. close": "256.8400",
			"5. volume": "2057"
		},
		"2022-07-15 19:00:00": {
			"1. open": "256.6900",
			"2. high": "256.7000",
			"3. low": "256.6900",
			"4. close": "256.7000",
			"5. volume": "506"
		},
	}
}

const RESULT_POLISH_COMPACT_30M = {
	"meta": {
		"information": "Intraday (30min) open, high, low, close prices and volume",
		"symbol": "MSFT",
		"updated": "2022-07-15 20:00:00",
		"interval": "30min",
		"size": "Compact",
		"zone": "US/Eastern"
	},
	"Time Series (30min)": {
		"2022-07-15T19:00:00.000Z": {
			"open": "256.8100",
			"high": "256.8900",
			"low": "256.7900",
			"close": "256.7900",
			"volume": "3008"
		},
		"2022-07-15T18:30:00.000Z": {
			"open": "256.7500",
			"high": "256.8400",
			"low": "256.7500",
			"close": "256.8400",
			"volume": "2057"
		},
		"2022-07-15T18:00:00.000Z": {
			"open": "256.6900",
			"high": "256.7000",
			"low": "256.6900",
			"close": "256.7000",
			"volume": "506"
		}
	}
}

avApiStub = {
	data: { intraday: sinon.fake.resolves(RESULT_SUCCESS_COMPACT_15M) },
	util: { polish: sinon.fake.returns(RESULT_POLISH_COMPACT_15M) },
}

describe("Node: alphavantage-core-stock-intraday", function () {

	this.timeout(2000)

	beforeEach(function (done) {

		helper.startServer(done)

		avNode = proxyquire("../src/stock-intraday", {
			"./util/api": {
				setClient: function () { return avApiStub }
			},
		})

	})
  
	afterEach(function (done) {

		helper.unload()
		helper.stopServer(done)
	})

	it("should be loaded", function (done) {
		var flow = [
			{
				id: "n1",
				type: "alphavantage-core-stock-intraday",
				name: "stock intraday test",
				apiConfig: "nc"
			}, 
			{
				id: "nc",
				type: "alphavantage-api-config",
				name: "api key"
			}
		]        

		helper.load([avConfig, avNode], flow, () => {
			var n1 = helper.getNode("n1")
			try {
				n1.should.have.property("name", "stock intraday test")
				done()
			} catch (err) {
				done(err)
			}
		})
	})

	it("override apiKey", function (done) {

		var newApiKey

		avNode = proxyquire("../src/stock-intraday", {
			"./util/api": {
				setClient: function (apiKey) { newApiKey = apiKey; return avApiStub }
			},
		})

		var flow = 
		[
			{
				id: "n1",
				type: "alphavantage-core-stock-intraday",
				name: "stock intraday test",
				apiConfig: "nc",
				symbol: "MSFT",
				outputSize: "compact",
				interval: "15",
				wires: [["n2"]]
			}, 
			{
				id: "nc",
				type: "alphavantage-api-config",
				name: "api key",
				apiKey: "demo"
			},
			{ id: "n2", type: "helper" }
		]
		helper.load([avConfig, avNode], flow, () => {
			var n2 = helper.getNode("n2")
			var n1 = helper.getNode("n1")
			n2.on("input", function () {
				
				try {
					newApiKey.should.be.equal("mynewkey")
					done()
				} catch(err) {
					done(err)
				}
			})
			n1.receive({ apiKey: "mynewkey" })
		})
	})

	it("symbol - configured", function (done) {

		var flow = 
		[
			{
				id: "n1",
				type: "alphavantage-core-stock-intraday",
				name: "stock intraday test",
				apiConfig: "nc",
				symbol: "MSFT",
				outputSize: "compact",
				interval: "15",
				wires: [["n2"]]
			}, 
			{
				id: "nc",
				type: "alphavantage-api-config",
				name: "api key",
				apiKey: "demo"
			},
			{ id: "n2", type: "helper" }
		]
		helper.load([avConfig, avNode], flow, () => {
			
			var n2 = helper.getNode("n2")
			var n1 = helper.getNode("n1")
			n2.on("input", function (msg) {
				
				try {
					msg.payload.should.have.property("data", 
						{
							"information": "Intraday (15min) open, high, low, close prices and volume",
							"symbol": "MSFT",
							"interval": "15min",
							"last_refreshed": "2022-07-15 20:00:00",
							"output_size": "Compact",
							"time_zone": "US/Eastern"
						})

					msg.payload.should.have.property("series", 
						{
							"2022-07-15 20:00:00": {
								"open": 256.8800,
								"high": 256.8900,
								"low": 256.7900,
								"close": 256.7900,
								"volume": 1993
							},
							"2022-07-15 19:45:00": {
								"open": 256.81,
								"high": 256.89,
								"low": 256.8,
								"close": 256.8,
								"volume": 1015
							},
							"2022-07-15 19:30:00": {
								"open": 256.75,
								"high": 256.84,
								"low": 256.75,
								"close": 256.84,
								"volume": 1954
							}
						})

					msg.payload.should.have.property("seriesArray", 
						[
							{
								"timestamp": "2022-07-15T19:00:00.000Z",
								"open": 256.88,
								"high": 256.89,
								"low": 256.79,
								"close": 256.79,
								"volume": 1993
							},
							{
								"timestamp": "2022-07-15T18:45:00.000Z",
								"open": 256.8100,
								"high": 256.8900,
								"low": 256.8000,
								"close": 256.8000,
								"volume": 1015
							},
							{
								"timestamp": "2022-07-15T18:30:00.000Z",
								"open": 256.75,
								"high": 256.84,
								"low": 256.75,
								"close": 256.84,
								"volume": 1954
							}
						])

					done()
				} catch(err) {
					done(err)
				}
			})
			n1.receive({ payload: {} })
			
		})
	})

	it("symbol - parameter", function (done) {

		var flow = 
		[
			{
				id: "n1",
				type: "alphavantage-core-stock-intraday",
				name: "stock intraday test",
				apiConfig: "nc",
				outputSize: "compact",
				interval: "15",
				wires: [["n2"]]
			}, 
			{
				id: "nc",
				type: "alphavantage-api-config",
				name: "api key",
				apiKey: "demo"
			},
			{ id: "n2", type: "helper" }
		]
		helper.load([avConfig, avNode], flow, () => {
			
			var n2 = helper.getNode("n2")
			var n1 = helper.getNode("n1")
			n2.on("input", function (msg) {
				
				try {
					msg.payload.should.have.property("data", 
						{
							"information": "Daily Prices (open, high, low, close) and Volumes",
							"symbol": "MSFT",
							"interval": undefined,
							"last_refreshed": "2022-07-18 16:00:01",
							"output_size": "Compact",
							"time_zone": "US/Eastern"
						})

					msg.payload.should.have.property("series", 
						{
							"2022-07-18 01:00:00": {
								"open": 259.75,
								"high": 260.84,
								"low": 253.3,
								"close": 254.25,
								"volume": 20942548
							},
							"2022-07-15 01:00:00": {
								"open": 255.72,
								"high": 260.3699,
								"low": 254.7727,
								"close": 256.72,
								"volume": 29774050
							},
							"2022-07-14 01:00:00": {
								"open": 250.57,
								"high": 255.1374,
								"low": 245.94,
								"close": 254.08,
								"volume": 25102823
							}
						})

					msg.payload.should.have.property("seriesArray", 
						[
							{
								"timestamp": "2022-07-18T00:00:00.000Z",
								"open": 259.75,
								"high": 260.84,
								"low": 253.3,
								"close": 254.25,
								"volume": 20942548
							},
							{
								"timestamp": "2022-07-15T00:00:00.000Z",
								"open": 255.72,
								"high": 260.3699,
								"low": 254.7727,
								"close": 256.72,
								"volume": 29774050
							},
							{
								"timestamp": "2022-07-14T00:00:00.000Z",
								"open": 250.57,
								"high": 255.1374,
								"low": 245.94,
								"close": 254.08,
								"volume": 25102823
							}
						])

					done()
				} catch(err) {
					done(err)
				}
			})
			n1.receive({ payload: {}, symbol: "MSFT" })
			
		})
	})

	it("symbol - not defined", function (done) {

		var flow = 
		[
			{
				id: "n1",
				type: "alphavantage-core-stock-intraday",
				name: "stock intraday test",
				apiConfig: "nc",
				outputSize: "compact",
				interval: "15",
				wires: [["n2"]]
			}, 
			{
				id: "nc",
				type: "alphavantage-api-config",
				name: "api key",
				apiKey: "demo"
			},
			{ id: "n2", type: "helper" }
		]
		helper.load([avConfig, avNode], flow, () => {
			
			var n1 = helper.getNode("n1")
			n1.on("call:warn", call => {
				call.should.be.calledWithExactly(`Missing "symbol" property`)
				done()
			})
			n1.receive({ payload: {} })
			
		})
	})

	it("outputSize compact - configured", function (done) {

		var flow = 
		[
			{
				id: "n1",
				type: "alphavantage-core-stock-intraday",
				name: "stock intraday test",
				apiConfig: "nc",
				symbol: "MSFT",
				outputSize: "compact",
				interval: "15",
				wires: [["n2"]]
			}, 
			{
				id: "nc",
				type: "alphavantage-api-config",
				name: "api key",
				apiKey: "demo"
			},
			{ id: "n2", type: "helper" }
		]
		helper.load([avConfig, avNode], flow, () => {
			
			var n2 = helper.getNode("n2")
			var n1 = helper.getNode("n1")
			n2.on("input", function (msg) {
				
				try {
					msg.payload.should.have.propertyByPath("data", "output_size").eql("Compact")
					msg.payload.should.have.property("series").should.not.have.keys("2022-07-12 00:00:00")
					msg.payload.should.have.property("seriesArray").length(3)

					done()
				} catch(err) {
					done(err)
				}
			})
			n1.receive({ payload: {} })
			
		})
	})

	it("outputSize compact - parameter", function (done) {

		var flow = 
		[
			{
				id: "n1",
				type: "alphavantage-core-stock-intraday",
				name: "stock intraday test",
				apiConfig: "nc",
				symbol: "MSFT",
				interval: "15",
				wires: [["n2"]]
			}, 
			{
				id: "nc",
				type: "alphavantage-api-config",
				name: "api key",
				apiKey: "demo"
			},
			{ id: "n2", type: "helper" }
		]
		helper.load([avConfig, avNode], flow, () => {
			
			var n2 = helper.getNode("n2")
			var n1 = helper.getNode("n1")
			n2.on("input", function (msg) {
				
				try {
					msg.payload.should.have.propertyByPath("data", "output_size").eql("Compact")
					msg.payload.series.should.not.have.keys("2022-07-15 18:15:00")
					msg.payload.should.have.property("seriesArray").length(3)

					done()
				} catch(err) {
					done(err)
				}
			})
			n1.receive({ payload: {}, outputSize: "compact" })
			
		})
	})

	it("outputSize compact - default", function (done) {

		var flow = 
		[
			{
				id: "n1",
				type: "alphavantage-core-stock-intraday",
				name: "stock intraday test",
				apiConfig: "nc",
				symbol: "MSFT",
				interval: "15",
				wires: [["n2"]]
			}, 
			{
				id: "nc",
				type: "alphavantage-api-config",
				name: "api key",
				apiKey: "demo"
			},
			{ id: "n2", type: "helper" }
		]
		helper.load([avConfig, avNode], flow, () => {
			
			var n2 = helper.getNode("n2")
			var n1 = helper.getNode("n1")
			n2.on("input", function (msg) {
				
				try {
					msg.payload.should.have.propertyByPath("data", "output_size").eql("Compact")
					msg.payload.series.should.not.have.keys("2022-07-15 18:15:00")
					msg.payload.should.have.property("seriesArray").length(3)

					done()
				} catch(err) {
					done(err)
				}
			})
			n1.receive({ payload: {} })
			
		})
	})

	it("outputSize full - configured", function (done) {

		var avApiStub = {
			data: { intraday: sinon.fake.resolves(RESULT_SUCCESS_FULL_15M) },
			util: { polish: sinon.fake.returns(RESULT_POLISH_FULL_15M) },
		}

		avNode = proxyquire("../src/stock-intraday", {
			"./util/api": {
				setClient: function () { return avApiStub },
			},
		})

		var flow = 
		[
			{
				id: "n1",
				type: "alphavantage-core-stock-intraday",
				name: "stock intraday test",
				apiConfig: "nc",
				symbol: "MSFT",
				outputSize: "full",
				interval: "15",
				wires: [["n2"]]
			}, 
			{
				id: "nc",
				type: "alphavantage-api-config",
				name: "api key",
				apiKey: "demo"
			},
			{ id: "n2", type: "helper" }
		]
		helper.load([avConfig, avNode], flow, () => {
			
			var n2 = helper.getNode("n2")
			var n1 = helper.getNode("n1")
			n2.on("input", function (msg) {
				
				try {
					msg.payload.should.have.propertyByPath("data", "output_size").eql("Full size")
					msg.payload.series.should.have.keys("2022-07-15 18:15:00")
					msg.payload.should.have.property("seriesArray").length(4)

					done()
				} catch(err) {
					done(err)
				}
			})
			n1.receive({ payload: {} })
			
		})
	})

	it("outputSize full - parameter", function (done) {

		var avApiStub = {
			data: { intraday: sinon.fake.resolves(RESULT_SUCCESS_FULL_15M) },
			util: { polish: sinon.fake.returns(RESULT_POLISH_FULL_15M) },
		}

		avNode = proxyquire("../src/stock-intraday", {
			"./util/api": {
				setClient: function () { return avApiStub },
			},
		})

		var flow = 
		[
			{
				id: "n1",
				type: "alphavantage-core-stock-intraday",
				name: "stock intraday test",
				apiConfig: "nc",
				symbol: "MSFT",
				interval: "15",
				wires: [["n2"]]
			}, 
			{
				id: "nc",
				type: "alphavantage-api-config",
				name: "api key",
				apiKey: "demo"
			},
			{ id: "n2", type: "helper" }
		]
		helper.load([avConfig, avNode], flow, () => {
			
			var n2 = helper.getNode("n2")
			var n1 = helper.getNode("n1")
			n2.on("input", function (msg) {
				
				try {
					msg.payload.should.have.propertyByPath("data", "output_size").eql("Full size")
					msg.payload.series.should.have.keys("2022-07-15 18:15:00")
					msg.payload.should.have.property("seriesArray").length(4)

					done()
				} catch(err) {
					done(err)
				}
			})
			n1.receive({ payload: {}, outputSize: "full" })
			
		})
	})

	it("outputSize - bad value", function (done) {

		var flow = 
		[
			{
				id: "n1",
				type: "alphavantage-core-stock-intraday",
				name: "stock intraday test",
				apiConfig: "nc",
				symbol: "MSFT",
				interval: "15",
				wires: [["n2"]]
			}, 
			{
				id: "nc",
				type: "alphavantage-api-config",
				name: "api key",
				apiKey: "demo"
			},
			{ id: "n2", type: "helper" }
		]
		helper.load([avConfig, avNode], flow, () => {
			
			var n1 = helper.getNode("n1")
			n1.on("call:warn", call => {
				call.should.be.calledWithExactly(`Bad "outputSize" property, expecting one of "full" or "compact", got "foo"`)
				done()
			})
			n1.receive({ payload: {}, outputSize: "foo" })
			
		})
	})

	it("interval - configured", function (done) {

		var avApiStub = {
			data: { intraday: sinon.fake.resolves(RESULT_SUCCESS_COMPACT_30M) },
			util: { polish: sinon.fake.returns(RESULT_POLISH_COMPACT_30M) },
		}

		avNode = proxyquire("../src/stock-intraday", {
			"./util/api": {
				setClient: function () { return avApiStub },
			},
		})

		var flow = 
		[
			{
				id: "n1",
				type: "alphavantage-core-stock-intraday",
				name: "stock intraday test",
				apiConfig: "nc",
				symbol: "MSFT",
				outputSize: "compact",
				interval: "30",
				wires: [["n2"]]
			}, 
			{
				id: "nc",
				type: "alphavantage-api-config",
				name: "api key",
				apiKey: "demo"
			},
			{ id: "n2", type: "helper" }
		]
		helper.load([avConfig, avNode], flow, () => {
			
			var n2 = helper.getNode("n2")
			var n1 = helper.getNode("n1")
			n2.on("input", function (msg) {
				
				try {
					msg.payload.should.have.property("data", 
						{
							"information": "Intraday (30min) open, high, low, close prices and volume",
							"symbol": "MSFT",
							"interval": "30min",
							"last_refreshed": "2022-07-15 20:00:00",
							"output_size": "Compact",
							"time_zone": "US/Eastern"
						})

					msg.payload.should.have.property("series", 
						{
							"2022-07-15 20:00:00": {
								"open": 256.81,
								"high": 256.89,
								"low": 256.79,
								"close": 256.79,
								"volume": 3008
							},
							"2022-07-15 19:30:00": {
								"open": 256.75,
								"high": 256.84,
								"low": 256.75,
								"close": 256.84,
								"volume": 2057
							},
							"2022-07-15 19:00:00": {
								"open": 256.69,
								"high": 256.7,
								"low": 256.69,
								"close": 256.7,
								"volume": 506
							}
						})

					msg.payload.should.have.property("seriesArray", 
						[
							{
								"timestamp": "2022-07-15T19:00:00.000Z",
								"open": 256.81,
								"high": 256.89,
								"low": 256.79,
								"close": 256.79,
								"volume": 3008
							},
							{
								"timestamp": "2022-07-15T18:30:00.000Z",
								"open": 256.75,
								"high": 256.84,
								"low": 256.75,
								"close": 256.84,
								"volume": 2057
							},
							{
								"timestamp": "2022-07-15T18:00:00.000Z",
								"open": 256.69,
								"high": 256.7,
								"low": 256.69,
								"close": 256.7,
								"volume": 506
							}
						])

					done()
				} catch(err) {
					done(err)
				}
			})
			n1.receive({ payload: {} })
			
		})
	})

	it("interval - parameter", function (done) {

		var avApiStub = {
			data: { intraday: sinon.fake.resolves(RESULT_SUCCESS_COMPACT_30M) },
			util: { polish: sinon.fake.returns(RESULT_POLISH_COMPACT_30M) },
		}

		avNode = proxyquire("../src/stock-intraday", {
			"./util/api": {
				setClient: function () { return avApiStub },
			},
		})

		var flow = 
		[
			{
				id: "n1",
				type: "alphavantage-core-stock-intraday",
				name: "stock intraday test",
				apiConfig: "nc",
				symbol: "MSFT",
				outputSize: "compact",
				wires: [["n2"]]
			}, 
			{
				id: "nc",
				type: "alphavantage-api-config",
				name: "api key",
				apiKey: "demo"
			},
			{ id: "n2", type: "helper" }
		]
		helper.load([avConfig, avNode], flow, () => {
			
			var n2 = helper.getNode("n2")
			var n1 = helper.getNode("n1")
			n2.on("input", function (msg) {
				
				try {
					msg.payload.should.have.property("data", 
						{
							"information": "Intraday (30min) open, high, low, close prices and volume",
							"symbol": "MSFT",
							"interval": "30min",
							"last_refreshed": "2022-07-15 20:00:00",
							"output_size": "Compact",
							"time_zone": "US/Eastern"
						})

					msg.payload.should.have.property("series", 
						{
							"2022-07-15 20:00:00": {
								"open": 256.81,
								"high": 256.89,
								"low": 256.79,
								"close": 256.79,
								"volume": 3008
							},
							"2022-07-15 19:30:00": {
								"open": 256.75,
								"high": 256.84,
								"low": 256.75,
								"close": 256.84,
								"volume": 2057
							},
							"2022-07-15 19:00:00": {
								"open": 256.69,
								"high": 256.7,
								"low": 256.69,
								"close": 256.7,
								"volume": 506
							}
						})

					msg.payload.should.have.property("seriesArray", 
						[
							{
								"timestamp": "2022-07-15T19:00:00.000Z",
								"open": 256.81,
								"high": 256.89,
								"low": 256.79,
								"close": 256.79,
								"volume": 3008
							},
							{
								"timestamp": "2022-07-15T18:30:00.000Z",
								"open": 256.75,
								"high": 256.84,
								"low": 256.75,
								"close": 256.84,
								"volume": 2057
							},
							{
								"timestamp": "2022-07-15T18:00:00.000Z",
								"open": 256.69,
								"high": 256.7,
								"low": 256.69,
								"close": 256.7,
								"volume": 506
							}
						])

					done()
				} catch(err) {
					done(err)
				}
			})
			n1.receive({ payload: {}, interval: "30" })
			
		})
	})

	it("interval - not defined", function (done) {

		var flow = 
		[
			{
				id: "n1",
				type: "alphavantage-core-stock-intraday",
				name: "stock intraday test",
				apiConfig: "nc",
				symbol: "MSFT",
				outputSize: "compact",
				wires: [["n2"]]
			}, 
			{
				id: "nc",
				type: "alphavantage-api-config",
				name: "api key",
				apiKey: "demo"
			},
			{ id: "n2", type: "helper" }
		]
		helper.load([avConfig, avNode], flow, () => {
			
			var n1 = helper.getNode("n1")
			n1.on("call:warn", call => {
				call.should.be.calledWithExactly(`Missing "interval" property`)
				done()
			})
			n1.receive({ payload: {} })
			
		})
	})

})