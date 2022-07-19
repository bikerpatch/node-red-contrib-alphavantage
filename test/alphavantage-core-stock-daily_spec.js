const helper = require("node-red-node-test-helper")
const avConfig = require("../src/config")
const sinon = require("sinon")
const apiUtil = require("../src/util/api")
const avNode = require("../src/stock-daily")

helper.init(require.resolve("node-red"))

const RESULT_SUCCESS_COMPACT = {
	"Meta Data": {
		"1. Information": "Daily Prices (open, high, low, close) and Volumes",
		"2. Symbol": "MSFT",
		"3. Last Refreshed": "2022-07-18 16:00:01",
		"4. Output Size": "Compact",
		"5. Time Zone": "US/Eastern"
	},
	"Time Series (Daily)": {
		"2022-07-18": {
			"1. open": "259.7500",
			"2. high": "260.8400",
			"3. low": "253.3000",
			"4. close": "254.2500",
			"5. volume": "20942548"
		},
		"2022-07-15": {
			"1. open": "255.7200",
			"2. high": "260.3699",
			"3. low": "254.7727",
			"4. close": "256.7200",
			"5. volume": "29774050"
		},
		"2022-07-14": {
			"1. open": "250.5700",
			"2. high": "255.1374",
			"3. low": "245.9400",
			"4. close": "254.0800",
			"5. volume": "25102823"
		},
	}
}

const RESULT_POLISH_COMPACT = {
	"meta": {
		"information": "Daily Prices (open, high, low, close) and Volumes",
		"symbol": "MSFT",
		"updated": "2022-07-18 16:00:01",
		"size": "Compact",
		"zone": "US/Eastern"
	},
	"data": {
		"2022-07-18T00:00:00.000Z": {
			"open": "259.7500",
			"high": "260.8400",
			"low": "253.3000",
			"close": "254.2500",
			"volume": "20942548"
		},
		"2022-07-15T00:00:00.000Z": {
			"open": "255.7200",
			"high": "260.3699",
			"low": "254.7727",
			"close": "256.7200",
			"volume": "29774050"
		},
		"2022-07-14T00:00:00.000Z": {
			"open": "250.5700",
			"high": "255.1374",
			"low": "245.9400",
			"close": "254.0800",
			"volume": "25102823"
		},
	}
}

const RESULT_SUCCESS_FULL = {
	"Meta Data": {
		"1. Information": "Daily Prices (open, high, low, close) and Volumes",
		"2. Symbol": "MSFT",
		"3. Last Refreshed": "2022-07-18 16:00:01",
		"4. Output Size": "Full size",
		"5. Time Zone": "US/Eastern"
	},
	"Time Series (Daily)": {
		...RESULT_SUCCESS_COMPACT["Time Series (Daily)"],
		"2022-07-13": {
			"1. open": "250.1900",
			"2. high": "253.5500",
			"3. low": "248.1100",
			"4. close": "252.7200",
			"5. volume": "29497423"
		},
	}
}

const RESULT_POLISH_FULL = {
	"meta": {
		"information": "Daily Prices (open, high, low, close) and Volumes",
		"symbol": "MSFT",
		"updated": "2022-07-18 16:00:01",
		"size": "Full size",
		"zone": "US/Eastern"
	},
	"data": {
		...RESULT_POLISH_COMPACT["data"],
		"2022-07-13T00:00:00.000Z": {
			"open": "250.1900",
			"high": "253.5500",
			"low": "248.1100",
			"close": "252.7200",
			"volume": "29497423"
		},
	}
}

var avStub

describe("Node: alphavantage-core-stock-daily", function () {

	this.timeout(2000)

	beforeEach(function (done) {

		avStub = sinon.stub(apiUtil, "setClient").returns({
			data: { daily: sinon.fake.resolves(RESULT_SUCCESS_COMPACT) },
			util: { polish: sinon.fake.returns(RESULT_POLISH_COMPACT) },
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
				type: "alphavantage-core-stock-daily",
				name: "stock daily test",
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
				n1.should.have.property("name", "stock daily test")
				done()
			} catch (err) {
				done(err)
			}
		})
	})

	it("tier threshold reached", function (done) {

		avStub.restore()
		avStub = sinon.stub(apiUtil, "setClient").returns({
			data: { daily: sinon.stub().throws("An AlphaVantage error occurred. {\"Note\":\"Thank you for using Alpha Vantage! Our standard API call frequency is 5 calls per minute and 500 calls per day. Please visit https://www.alphavantage.co/premium/ if you would like to target a higher API call frequency.\"}") },
			util: { polish: sinon.stub().throws("An AlphaVantage error occurred. {\"Note\":\"Thank you for using Alpha Vantage! Our standard API call frequency is 5 calls per minute and 500 calls per day. Please visit https://www.alphavantage.co/premium/ if you would like to target a higher API call frequency.\"}") },
		})

		var flow = 
		[
			{
				id: "n1",
				type: "alphavantage-core-stock-daily",
				name: "stock daily test",
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
				type: "alphavantage-core-stock-daily",
				name: "stock daily test",
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
			n2.on("input", function () {
				
				try {
					avStub.should.be.calledWithExactly(newApiKey)
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
				type: "alphavantage-core-stock-daily",
				name: "stock daily test",
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
							"information": "Daily Prices (open, high, low, close) and Volumes",
							"symbol": "MSFT",
							"interval": undefined,
							"last_refreshed": "2022-07-18 16:00:01",
							"output_size": "Compact",
							"time_zone": "US/Eastern"
						})

					msg.payload.should.have.property("series", 
						{
							"2022-07-18": {
								"open": 259.75,
								"high": 260.84,
								"low": 253.3,
								"close": 254.25,
								"volume": 20942548
							},
							"2022-07-15": {
								"open": 255.72,
								"high": 260.3699,
								"low": 254.7727,
								"close": 256.72,
								"volume": 29774050
							},
							"2022-07-14": {
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
								"date": "2022-07-18",
								"open": 259.75,
								"high": 260.84,
								"low": 253.3,
								"close": 254.25,
								"volume": 20942548
							},
							{
								"date": "2022-07-15",
								"open": 255.72,
								"high": 260.3699,
								"low": 254.7727,
								"close": 256.72,
								"volume": 29774050
							},
							{
								"date": "2022-07-14",
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
			n1.receive({ payload: {} })
			
		})
	})

	it("symbol - parameter", function (done) {

		var flow = 
		[
			{
				id: "n1",
				type: "alphavantage-core-stock-daily",
				name: "stock daily test",
				apiConfig: "nc",
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
							"information": "Daily Prices (open, high, low, close) and Volumes",
							"symbol": "MSFT",
							"interval": undefined,
							"last_refreshed": "2022-07-18 16:00:01",
							"output_size": "Compact",
							"time_zone": "US/Eastern"
						})

					msg.payload.should.have.property("series", 
						{
							"2022-07-18": {
								"open": 259.75,
								"high": 260.84,
								"low": 253.3,
								"close": 254.25,
								"volume": 20942548
							},
							"2022-07-15": {
								"open": 255.72,
								"high": 260.3699,
								"low": 254.7727,
								"close": 256.72,
								"volume": 29774050
							},
							"2022-07-14": {
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
								"date": "2022-07-18",
								"open": 259.75,
								"high": 260.84,
								"low": 253.3,
								"close": 254.25,
								"volume": 20942548
							},
							{
								"date": "2022-07-15",
								"open": 255.72,
								"high": 260.3699,
								"low": 254.7727,
								"close": 256.72,
								"volume": 29774050
							},
							{
								"date": "2022-07-14",
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
				type: "alphavantage-core-stock-daily",
				name: "stock daily test",
				apiConfig: "nc",
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
				type: "alphavantage-core-stock-daily",
				name: "stock daily test",
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
				type: "alphavantage-core-stock-daily",
				name: "stock daily test",
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
			
			var n2 = helper.getNode("n2")
			var n1 = helper.getNode("n1")
			n2.on("input", function (msg) {
				
				try {
					msg.payload.should.have.propertyByPath("data", "output_size").eql("Compact")
					msg.payload.series.should.not.have.keys("2022-07-13 01:00:00")
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
				type: "alphavantage-core-stock-daily",
				name: "stock daily test",
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
			
			var n2 = helper.getNode("n2")
			var n1 = helper.getNode("n1")
			n2.on("input", function (msg) {
				
				try {
					msg.payload.should.have.propertyByPath("data", "output_size").eql("Compact")
					msg.payload.series.should.not.have.keys("2022-07-13 01:00:00")
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
			data: { daily: sinon.fake.resolves(RESULT_SUCCESS_FULL) },
			util: { polish: sinon.fake.returns(RESULT_POLISH_FULL) },
		})

		var flow = 
		[
			{
				id: "n1",
				type: "alphavantage-core-stock-daily",
				name: "stock daily test",
				apiConfig: "nc",
				symbol: "MSFT",
				outputSize: "full",
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
					msg.payload.series.should.have.keys("2022-07-13 01:00:00")
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
			data: { daily: sinon.fake.resolves(RESULT_SUCCESS_FULL) },
			util: { polish: sinon.fake.returns(RESULT_POLISH_FULL) },
		})

		var flow = 
		[
			{
				id: "n1",
				type: "alphavantage-core-stock-daily",
				name: "stock daily test",
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
			
			var n2 = helper.getNode("n2")
			var n1 = helper.getNode("n1")
			n2.on("input", function (msg) {
				
				try {
					msg.payload.should.have.propertyByPath("data", "output_size").eql("Full size")
					msg.payload.series.should.have.keys("2022-07-13 01:00:00")
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
				type: "alphavantage-core-stock-daily",
				name: "stock daily test",
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
				call.should.be.calledWithExactly(`Bad "outputSize" property, expecting one of "full" or "compact", got "foo"`)
				done()
			})
			n1.receive({ payload: {}, outputSize: "foo" })
			
		})
	})

})