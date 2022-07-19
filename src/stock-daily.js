const apiUtil = require("./util/api")
const wrapDone = require("./util/wrapDone")
const wrapSend = require("./util/wrapSend")

module.exports = (RED) => {
	RED.nodes.registerType("alphavantage-core-stock-daily", function (config) {

		RED.nodes.createNode(this, config)

		const node = this

		this.on("input", async (msg, send, done) => {

			const Done = wrapDone(node, done)
			const Send = wrapSend(node, send)
			try {

				const apiConfig = RED.nodes.getNode(config.apiConfig)
				const api = apiUtil.setClient(msg.apiKey || apiConfig.apiKey )

				const symbol = msg.symbol || config.symbol
				const outputSize = msg.outputSize || config.outputSize || "compact"
                

				if (!symbol || symbol === "") {
					this.warn("Missing \"symbol\" property")
					Done()
					return
				}

				if (outputSize !== "full" && outputSize !== "compact") {
					this.warn(`Bad "outputSize" property, expecting one of "full" or "compact", got "${outputSize}"`)
					Done()
					return
				}

				this.debug(`Requesting stock time series daily data for ${symbol}`)

				const result = api.util.polish(await api.data.daily(symbol, outputSize, "json"))

				msg.payload.series = mapSeriesObj(result.data) // backward compat
				msg.payload.seriesArray = mapSeriesArray(result.data) // new array
				msg.payload.data = mapData(result.meta) // backward compat

				Send(msg)
				Done()

			} catch (error) {

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
