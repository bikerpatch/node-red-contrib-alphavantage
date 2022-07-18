const helper = require("node-red-node-test-helper")
const avConfig = require("../src/config")
const sinon = require("sinon")
var proxyquire = require("proxyquire").noPreserveCache()

helper.init(require.resolve("node-red"))

var avNode // the module to test
var avApiStub

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

avApiStub = {
	data: { quote: sinon.fake.resolves(RESULT_SUCCESS) },
	util: { polish: sinon.fake.returns(RESULT_POLISH) },
}

describe("Node: alphavantage-core-stock-quote", function () {

	this.timeout(2000)

	beforeEach(function (done) {

		helper.startServer(done)

		avNode = proxyquire("../src/stock-quote", {
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

	it("override apiKey", function (done) {

		var newApiKey

		avNode = proxyquire("../src/stock-quote", {
			"./util/api": {
				setClient: function (apiKey) { newApiKey = apiKey; return avApiStub }
			},
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
					
					msg.payload.should.have.property("symbol", "MSFT")
					msg.payload.should.have.property("open", 259.75)
					msg.payload.should.have.property("high", 260.84)
					msg.payload.should.have.property("low", 253.3)
					msg.payload.should.have.property("price", 254.25)
					msg.payload.should.have.property("volume", 20957772)
					msg.payload.should.have.property("latest_trading_day", "2022-07-18")
					msg.payload.should.have.property("prev_close", 256.72)
					msg.payload.should.have.property("change", -2.47)
					msg.payload.should.have.property("change_percent", -0.009621)
		
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

					msg.payload.should.have.property("symbol", "MSFT")
					msg.payload.should.have.property("open", 259.75)
					msg.payload.should.have.property("high", 260.84)
					msg.payload.should.have.property("low", 253.3)
					msg.payload.should.have.property("price", 254.25)
					msg.payload.should.have.property("volume", 20957772)
					msg.payload.should.have.property("latest_trading_day", "2022-07-18")
					msg.payload.should.have.property("prev_close", 256.72)
					msg.payload.should.have.property("change", -2.47)
					msg.payload.should.have.property("change_percent", -0.009621)

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