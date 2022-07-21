const apiUtil = require("./util/api")
const wrapDone = require("./util/wrapDone")
const wrapSend = require("./util/wrapSend")

module.exports = (RED) => {
	RED.nodes.registerType("alphavantage-core-stock-quote", function (config) {

		RED.nodes.createNode(this, config)

		const node = this

		this.on("input", async (msg, send, done) => {

			const Done = wrapDone(node, done)
			const Send = wrapSend(node, send)
			try {

				const apiConfig = RED.nodes.getNode(config.apiConfig)
				const api = apiUtil.setClient(msg.apiKey || apiConfig.apiKey )

				if (!config.keepApiKeyOnceUsed)
					delete msg.apiKey

				const symbol = msg.symbol || config.symbol
                

				if (!symbol || symbol === "") {
					this.warn("Missing \"symbol\" property")
					Done()
					return
				}

				this.debug(`Requesting stock quote data for ${symbol}`)

				const result = api.util.polish(await api.data.quote(symbol, "compact", "json"))

				msg.payload = apiUtil.mapQuoteObj(result.data)

				Send(msg)
				Done()
                
			}  catch (error) {

				if (error.name && error.name.startsWith("An AlphaVantage error occurred")) {
					this.error(apiUtil.processAVError(error))
				} else if (typeof error === "string") {

					this.error(error)
				} else {
					this.error(JSON.stringify(error))
				}

				return
				
			}
		})
	})
}
