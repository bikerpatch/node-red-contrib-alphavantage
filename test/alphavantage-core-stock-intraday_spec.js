const helper = require("node-red-node-test-helper")
const avConfig = require("../src/config")
const sinon = require("sinon")
const apiUtil = require("../src/util/api")
const avNode = require("../src/stock-intraday")

helper.init(require.resolve("node-red"))

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
	"Time Series (15min)": {
		...RESULT_POLISH_COMPACT_15M["Time Series (15min)"],
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

var avStub

describe("Node: alphavantage-core-stock-intraday", function () {

	this.timeout(2000)

	beforeEach(function (done) {

		avStub = sinon.stub(apiUtil, "setClient").returns({
			data: { intraday: sinon.fake.resolves(RESULT_SUCCESS_COMPACT_15M) },
			util: { polish: sinon.fake.returns(RESULT_POLISH_COMPACT_15M) },
		})

		

		helper.startServer(done)

	})
  
	afterEach(function (done) {

		avStub.restore()

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

	it("tier threshold reached", function (done) {

		avStub.restore()
		avStub = sinon.stub(apiUtil, "setClient").returns({
			data: { intraday: sinon.stub().throws("An AlphaVantage error occurred. {\"Note\":\"Thank you for using Alpha Vantage! Our standard API call frequency is 5 calls per minute and 500 calls per day. Please visit https://www.alphavantage.co/premium/ if you would like to target a higher API call frequency.\"}") },
			util: { polish: sinon.stub().throws("An AlphaVantage error occurred. {\"Note\":\"Thank you for using Alpha Vantage! Our standard API call frequency is 5 calls per minute and 500 calls per day. Please visit https://www.alphavantage.co/premium/ if you would like to target a higher API call frequency.\"}") },
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
				interval: 15,
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
			n1.on("call:error", call => {

				try {
					call.should.be.calledWithExactly(`Thank you for using Alpha Vantage! Our standard API call frequency is 5 calls per minute and 500 calls per day. Please visit https://www.alphavantage.co/premium/ if you would like to target a higher API call frequency.`)
					done()

				} catch(err) {
					done(err)
				}
			})
			n1.receive({ })
		})
	})

	it("override apiKey", function (done) {

		var newApiKey = "mynewkey"

		var flow = 
		[
			{
				id: "n1",
				type: "alphavantage-core-stock-intraday",
				name: "stock intraday test",
				apiConfig: "nc",
				symbol: "MSFT",
				outputSize: "compact",
				interval: 15,
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
					avStub.should.be.calledWithExactly(newApiKey)
					msg.should.not.have.property("apiKey")
					done()
				} catch(err) {
					done(err)
				}
			})
			n1.receive({ apiKey: newApiKey })
		})
	})

	it("override apiKey - keepApiKeyOnceUsed", function (done) {

		var newApiKey = "mynewkey"

		var flow = 
		[
			{
				id: "n1",
				type: "alphavantage-core-stock-intraday",
				name: "stock intraday test",
				apiConfig: "nc",
				keepApiKeyOnceUsed: true,
				symbol: "MSFT",
				outputSize: "compact",
				interval: 15,
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
					avStub.should.be.calledWithExactly(newApiKey)
					msg.should.have.property("apiKey", newApiKey)
					done()
				} catch(err) {
					done(err)
				}
			})
			n1.receive({ apiKey: newApiKey })
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
				interval: 15,
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
								"timestamp": "2022-07-15T20:00:00.000-04:00",
								"open": 256.8800,
								"high": 256.8900,
								"low": 256.7900,
								"close": 256.7900,
								"volume": 1993
							},
							"2022-07-15 19:45:00": {
								"timestamp": "2022-07-15T19:45:00.000-04:00",
								"open": 256.81,
								"high": 256.89,
								"low": 256.8,
								"close": 256.8,
								"volume": 1015
							},
							"2022-07-15 19:30:00": {
								"timestamp": "2022-07-15T19:30:00.000-04:00",
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
								"timestamp": "2022-07-15T20:00:00.000-04:00",
								"datetime": "2022-07-15 20:00:00",
								"open": 256.88,
								"high": 256.89,
								"low": 256.79,
								"close": 256.79,
								"volume": 1993
							},
							{
								"timestamp": "2022-07-15T19:45:00.000-04:00",
								"datetime": "2022-07-15 19:45:00",
								"open": 256.8100,
								"high": 256.8900,
								"low": 256.8000,
								"close": 256.8000,
								"volume": 1015
							},
							{
								"timestamp": "2022-07-15T19:30:00.000-04:00",
								"datetime": "2022-07-15 19:30:00",
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
				interval: 15,
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
								"timestamp": "2022-07-15T20:00:00.000-04:00",
								"open": 256.8800,
								"high": 256.8900,
								"low": 256.7900,
								"close": 256.7900,
								"volume": 1993
							},
							"2022-07-15 19:45:00": {
								"timestamp": "2022-07-15T19:45:00.000-04:00",
								"open": 256.81,
								"high": 256.89,
								"low": 256.8,
								"close": 256.8,
								"volume": 1015
							},
							"2022-07-15 19:30:00": {
								"timestamp": "2022-07-15T19:30:00.000-04:00",
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
								"timestamp": "2022-07-15T20:00:00.000-04:00",
								"datetime": "2022-07-15 20:00:00",
								"open": 256.88,
								"high": 256.89,
								"low": 256.79,
								"close": 256.79,
								"volume": 1993
							},
							{
								"timestamp": "2022-07-15T19:45:00.000-04:00",
								"datetime": "2022-07-15 19:45:00",
								"open": 256.8100,
								"high": 256.8900,
								"low": 256.8000,
								"close": 256.8000,
								"volume": 1015
							},
							{
								"timestamp": "2022-07-15T19:30:00.000-04:00",
								"datetime": "2022-07-15 19:30:00",
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
				interval: 15,
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
				interval: 15,
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
					msg.payload.should.not.have.keys("2022-07-15 19:15:00")
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
				interval: 15,
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
					msg.payload.series.should.not.have.keys("2022-07-15 19:15:00")
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
				interval: 15,
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
					msg.payload.series.should.not.have.keys("2022-07-15 19:15:00")
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

		avStub.restore()
		avStub = sinon.stub(apiUtil, "setClient").returns({
			data: { intraday: sinon.fake.resolves(RESULT_SUCCESS_FULL_15M) },
			util: { polish: sinon.fake.returns(RESULT_POLISH_FULL_15M) },
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
				interval: 15,
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
					msg.payload.series.should.have.keys("2022-07-15 19:15:00")
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

		avStub.restore()
		avStub = sinon.stub(apiUtil, "setClient").returns({
			data: { intraday: sinon.fake.resolves(RESULT_SUCCESS_FULL_15M) },
			util: { polish: sinon.fake.returns(RESULT_POLISH_FULL_15M) },
		})

		var flow = 
		[
			{
				id: "n1",
				type: "alphavantage-core-stock-intraday",
				name: "stock intraday test",
				apiConfig: "nc",
				symbol: "MSFT",
				interval: 15,
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
					msg.payload.series.should.have.keys("2022-07-15 19:15:00")
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
				interval: 15,
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

		avStub.restore()
		avStub = sinon.stub(apiUtil, "setClient").returns({
			data: { intraday: sinon.fake.resolves(RESULT_SUCCESS_COMPACT_30M) },
			util: { polish: sinon.fake.returns(RESULT_POLISH_COMPACT_30M) },
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
				interval: 30,
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
								"timestamp": "2022-07-15T20:00:00.000-04:00",
								"open": 256.81,
								"high": 256.89,
								"low": 256.79,
								"close": 256.79,
								"volume": 3008
							},
							"2022-07-15 19:30:00": {
								"timestamp": "2022-07-15T19:30:00.000-04:00",
								"open": 256.75,
								"high": 256.84,
								"low": 256.75,
								"close": 256.84,
								"volume": 2057
							},
							"2022-07-15 19:00:00": {
								"timestamp": "2022-07-15T19:00:00.000-04:00",
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
								"timestamp": "2022-07-15T20:00:00.000-04:00",
								"datetime": "2022-07-15 20:00:00",
								"open": 256.81,
								"high": 256.89,
								"low": 256.79,
								"close": 256.79,
								"volume": 3008
							},
							{
								"timestamp": "2022-07-15T19:30:00.000-04:00",
								"datetime": "2022-07-15 19:30:00",
								"open": 256.75,
								"high": 256.84,
								"low": 256.75,
								"close": 256.84,
								"volume": 2057
							},
							{
								"timestamp": "2022-07-15T19:00:00.000-04:00",
								"datetime": "2022-07-15 19:00:00",
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

		avStub.restore()
		avStub = sinon.stub(apiUtil, "setClient").returns({
			data: { intraday: sinon.fake.resolves(RESULT_SUCCESS_COMPACT_30M) },
			util: { polish: sinon.fake.returns(RESULT_POLISH_COMPACT_30M) },
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
								"timestamp": "2022-07-15T20:00:00.000-04:00",
								"open": 256.81,
								"high": 256.89,
								"low": 256.79,
								"close": 256.79,
								"volume": 3008
							},
							"2022-07-15 19:30:00": {
								"timestamp": "2022-07-15T19:30:00.000-04:00",
								"open": 256.75,
								"high": 256.84,
								"low": 256.75,
								"close": 256.84,
								"volume": 2057
							},
							"2022-07-15 19:00:00": {
								"timestamp": "2022-07-15T19:00:00.000-04:00",
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
								"timestamp": "2022-07-15T20:00:00.000-04:00",
								"datetime": "2022-07-15 20:00:00",
								"open": 256.81,
								"high": 256.89,
								"low": 256.79,
								"close": 256.79,
								"volume": 3008
							},
							{
								"timestamp": "2022-07-15T19:30:00.000-04:00",
								"datetime": "2022-07-15 19:30:00",
								"open": 256.75,
								"high": 256.84,
								"low": 256.75,
								"close": 256.84,
								"volume": 2057
							},
							{
								"timestamp": "2022-07-15T19:00:00.000-04:00",
								"datetime": "2022-07-15 19:00:00",
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
			n1.receive({ payload: {}, interval: 30 })
			
		})
	})

	it("interval - string conversion", function (done) {

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
								"timestamp": "2022-07-15T20:00:00.000-04:00",
								"open": 256.8800,
								"high": 256.8900,
								"low": 256.7900,
								"close": 256.7900,
								"volume": 1993
							},
							"2022-07-15 19:45:00": {
								"timestamp": "2022-07-15T19:45:00.000-04:00",
								"open": 256.81,
								"high": 256.89,
								"low": 256.8,
								"close": 256.8,
								"volume": 1015
							},
							"2022-07-15 19:30:00": {
								"timestamp": "2022-07-15T19:30:00.000-04:00",
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
								"timestamp": "2022-07-15T20:00:00.000-04:00",
								"datetime": "2022-07-15 20:00:00",
								"open": 256.88,
								"high": 256.89,
								"low": 256.79,
								"close": 256.79,
								"volume": 1993
							},
							{
								"timestamp": "2022-07-15T19:45:00.000-04:00",
								"datetime": "2022-07-15 19:45:00",
								"open": 256.8100,
								"high": 256.8900,
								"low": 256.8000,
								"close": 256.8000,
								"volume": 1015
							},
							{
								"timestamp": "2022-07-15T19:30:00.000-04:00",
								"datetime": "2022-07-15 19:30:00",
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
			n1.receive({ payload: {}, interval: "15" })
			
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

	it("interval - bad value", function (done) {

		var flow = 
		[
			{
				id: "n1",
				type: "alphavantage-core-stock-intraday",
				name: "stock intraday test",
				apiConfig: "nc",
				symbol: "MSFT",
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
				call.should.be.calledWithExactly(`Bad "interval" property, expecting one of 1, 5, 15, 30, 60, got "16"`)
				done()
			})
			n1.receive({ payload: {}, interval: 16 })
			
		})
	})

})