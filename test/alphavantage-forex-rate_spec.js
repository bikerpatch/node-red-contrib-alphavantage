const helper = require("node-red-node-test-helper")
const avConfig = require("../src/config")
const sinon = require("sinon")
var proxyquire = require("proxyquire").noPreserveCache()

helper.init(require.resolve("node-red"))

var avNode // the module to test
var avApiStub

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

avApiStub = {
	forex: { rate: sinon.fake.resolves(RESULT_SUCCESS) },
	util: { polish: sinon.fake.returns(RESULT_POLISH) },
}

describe("Node: alphavantage-forex-rate", function () {

	this.timeout(2000)

	beforeEach(function (done) {

		helper.startServer(done)

		avNode = proxyquire("../src/forex", {
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

	it("override apiKey", function (done) {

		var newApiKey

		avNode = proxyquire("../src/forex", {
			"./util/api": {
				setClient: function (apiKey) { newApiKey = apiKey; return avApiStub }
			},
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