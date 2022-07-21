const helper = require("node-red-node-test-helper")
const avConfig = require("../src/config")
const sinon = require("sinon")
const apiUtil = require("../src/util/api")
const avNode = require("../src/forex")

helper.init(require.resolve("node-red"))

const RESULT_SUCCESS = {
	"Realtime Currency Exchange Rate": {
		"1. From_Currency Code": "USD",
		"2. From_Currency Name": "United States Dollar",
		"3. To_Currency Code": "GBP",
		"4. To_Currency Name": "British Pound Sterling",
		"5. Exchange Rate": "0.83500000",
		"6. Last Refreshed": "2022-07-18 17:13:03",
		"7. Time Zone": "UTC",
		"8. Bid Price": "0.83500000",
		"9. Ask Price": "0.83500000"
	}
}

const RESULT_POLISH = {
	"rate": {
		"from_currency": "USD",
		"from_currency_name": "United States Dollar",
		"to_currency": "GBP",
		"to_currency_name": "British Pound Sterling",
		"value": "0.83500000",
		"updated": "2022-07-18 17:13:03",
		"zone": "UTC",
		"8. Bid Price": "0.83500000",
		"9. Ask Price": "0.83500000"
	}
}

var avStub

describe("Node: alphavantage-forex-rate", function () {

	this.timeout(2000)

	beforeEach(function (done) {

		avStub = sinon.stub(apiUtil, "setClient").returns({
			forex: { rate: sinon.fake.resolves(RESULT_SUCCESS) },
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
				type: "alphavantage-forex-rate",
				name: "forex test",
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
				n1.should.have.property("name", "forex test")
				done()
			} catch (err) {
				done(err)
			}
		})
	})

	it("tier threshold reached", function (done) {

		avStub.restore()
		avStub = sinon.stub(apiUtil, "setClient").returns({
			forex: { rate: sinon.stub().throws("An AlphaVantage error occurred. {\"Note\":\"Thank you for using Alpha Vantage! Our standard API call frequency is 5 calls per minute and 500 calls per day. Please visit https://www.alphavantage.co/premium/ if you would like to target a higher API call frequency.\"}") },
			util: { polish: sinon.stub().throws("An AlphaVantage error occurred. {\"Note\":\"Thank you for using Alpha Vantage! Our standard API call frequency is 5 calls per minute and 500 calls per day. Please visit https://www.alphavantage.co/premium/ if you would like to target a higher API call frequency.\"}") },
		})

		var flow = 
		[
			{
				id: "n1",
				type: "alphavantage-forex-rate",
				name: "forex test",
				apiConfig: "nc",
				fromCurrency: "USD",
				toCurrency: "GBP",
				wires: [["n2"]]
			}, 
			{
				id: "nc",
				type: "alphavantage-api-config",
				name: "api key"
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
				type: "alphavantage-forex-rate",
				name: "forex test",
				apiConfig: "nc",
				fromCurrency: "USD",
				toCurrency: "GBP",
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
				type: "alphavantage-forex-rate",
				name: "forex test",
				apiConfig: "nc",
				keepApiKeyOnceUsed: true,
				fromCurrency: "USD",
				toCurrency: "GBP",
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

	it("USD to GBP - configured", function (done) {

		var flow = 
		[
			{
				id: "n1",
				type: "alphavantage-forex-rate",
				name: "forex test",
				apiConfig: "nc",
				fromCurrency: "USD",
				toCurrency: "GBP",
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
					msg.payload.should.have.property("rate", 0.835)
					msg.payload.should.not.have.property("amount")
					done()
				} catch(err) {
					done(err)
				}
			})
			n1.receive({ payload: {} })
		})
	})

	it("USD to GBP - toCurrency injected", function (done) {

		var flow = 
		[
			{
				id: "n1",
				type: "alphavantage-forex-rate",
				name: "forex test",
				apiConfig: "nc",
				fromCurrency: "USD",
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
					msg.payload.should.have.property("rate", 0.835)
					msg.payload.should.not.have.property("amount")
					done()
				} catch(err) {
					done(err)
				}
			})
			n1.receive({ toCurrency: "GBP" } )
		})
	})

	it("USD to GBP - fromCurrency injected", function (done) {

		var flow = 
		[
			{
				id: "n1",
				type: "alphavantage-forex-rate",
				name: "forex test",
				apiConfig: "nc",
				toCurrency: "GBP",
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
					msg.payload.should.have.property("rate", 0.835)
					msg.payload.should.not.have.property("amount")
					done()
				} catch(err) {
					done(err)
				}
			})
			n1.receive({ fromCurrency: "USD" } )
		})
	})

	it("USD to GBP - fromCurrency and toCurrency injected", function (done) {

		var flow = 
		[
			{
				id: "n1",
				type: "alphavantage-forex-rate",
				name: "forex test",
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
					msg.payload.should.have.property("rate", 0.835)
					msg.payload.should.not.have.property("amount")
					done()
				} catch(err) {
					done(err)
				}
			})
			n1.receive({ fromCurrency: "USD", toCurrency: "GBP" } )
		})
	})

	it("USD to GBP - amount injected", function (done) {

		var flow = 
		[
			{
				id: "n1",
				type: "alphavantage-forex-rate",
				name: "forex test",
				apiConfig: "nc",
				fromCurrency: "USD",
				toCurrency: "GBP",
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
					msg.payload.should.have.property("rate", 0.835)
					msg.payload.should.have.property("amount", 41.75)
					done()
				} catch(err) {
					done(err)
				}
			})
			n1.receive({ amount: 50.0 })
		})
	})

	it("USD to GBP - fromCurrency not defined", function (done) {

		var flow = 
		[
			{
				id: "n1",
				type: "alphavantage-forex-rate",
				name: "forex test",
				apiConfig: "nc",
				toCurrency: "GBP",
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
				call.should.be.calledWithExactly(`Missing "fromCurrency" property`)
				done()
			})
			n1.receive({})
		})
	})

	it("USD to GBP - toCurrency not defined", function (done) {

		var flow = 
		[
			{
				id: "n1",
				type: "alphavantage-forex-rate",
				name: "forex test",
				apiConfig: "nc",
				fromCurrency: "USD",
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
				call.should.be.calledWithExactly(`Missing "toCurrency" property`)
				done()
			})
			n1.receive({})
		})
	})

})