const helper = require("node-red-node-test-helper")
const avConfig = require("../src/config")
const sinon = require("sinon")
const apiUtil = require("../src/util/api")
const avNode = require("../src/stock-quote")

helper.init(require.resolve("node-red"))

const RESULT_SUCCESS = {
	"Global Quote": {
		"01. symbol": "MSFT",
		"02. open": "259.7500",
		"03. high": "260.8400",
		"04. low": "253.3000",
		"05. price": "254.2500",
		"06. volume": "20957772",
		"07. latest trading day": "2022-07-18",
		"08. previous close": "256.7200",
		"09. change": "-2.4700",
		"10. change percent": "-0.9621%"
	}
}

const RESULT_POLISH = {
	"data": {
		"symbol": "MSFT",
		"open": "259.7500",
		"high": "260.8400",
		"low": "253.3000",
		"price": "254.2500",
		"volume": "20957772",
		"latest_trading_day": "2022-07-18",
		"prev_close": "256.7200",
		"change": "-2.4700",
		"change_percent": "-0.9621%"
	}
}

var avStub

describe("Node: alphavantage-core-stock-quote", function () {

	this.timeout(2000)

	beforeEach(function (done) {

		avStub = sinon.stub(apiUtil, "setClient").returns({
			data: { quote: sinon.fake.resolves(RESULT_SUCCESS) },
			util: { polish: sinon.fake.returns(RESULT_POLISH) },
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
				type: "alphavantage-core-stock-quote",
				name: "stock quote test",
				symbol: "MSFT",
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
				n1.should.have.property("name", "stock quote test")
				done()
			} catch (err) {
				done(err)
			}
		})
	})

	it("tier threshold reached", function (done) {

		avStub.restore()
		avStub = sinon.stub(apiUtil, "setClient").returns({
			data: { quote: sinon.stub().throws("An AlphaVantage error occurred. {\"Note\":\"Thank you for using Alpha Vantage! Our standard API call frequency is 5 calls per minute and 500 calls per day. Please visit https://www.alphavantage.co/premium/ if you would like to target a higher API call frequency.\"}") },
			util: { polish: sinon.stub().throws("An AlphaVantage error occurred. {\"Note\":\"Thank you for using Alpha Vantage! Our standard API call frequency is 5 calls per minute and 500 calls per day. Please visit https://www.alphavantage.co/premium/ if you would like to target a higher API call frequency.\"}") },
		})

		var flow = 
		[
			{
				id: "n1",
				type: "alphavantage-core-stock-quote",
				name: "stock quote test",
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
				type: "alphavantage-core-stock-quote",
				name: "stock quote test",
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
				type: "alphavantage-core-stock-quote",
				name: "stock quote test",
				apiConfig: "nc",
				keepApiKeyOnceUsed: true,
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
				type: "alphavantage-core-stock-quote",
				name: "stock quote test",
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
					
					msg.should.have.property("payload", {
						"symbol": "MSFT",
						"open": 259.75,
						"high": 260.84,
						"low": 253.3,
						"price": 254.25,
						"volume": 20957772,
						"latest_trading_day": "2022-07-18",
						"prev_close": 256.72,
						"change": -2.47,
						"change_percent": -0.009621
					})
		
					done()
				} catch(err) {
					done(err)
				}
			})
			n1.receive({ payload: {} })
		})
	})

	it("symbol - injected", function (done) {

		var flow = 
		[
			{
				id: "n1",
				type: "alphavantage-core-stock-quote",
				name: "stock quote test",
				apiConfig: "nc",
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

					msg.should.have.property("payload", {
						"symbol": "MSFT",
						"open": 259.75,
						"high": 260.84,
						"low": 253.3,
						"price": 254.25,
						"volume": 20957772,
						"latest_trading_day": "2022-07-18",
						"prev_close": 256.72,
						"change": -2.47,
						"change_percent": -0.009621
					})

					done()
				} catch(err) {
					done(err)
				}
			})
			n1.receive({ symbol: "MSFT" } )
		})
	})

	it("symbol - not defined", function (done) {

		var flow = 
		[
			{
				id: "n1",
				type: "alphavantage-core-stock-quote",
				name: "stock quote test",
				apiConfig: "nc",
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
			n1.receive({})
		})
	})

})