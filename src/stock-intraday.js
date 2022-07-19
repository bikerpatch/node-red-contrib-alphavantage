const apiUtil = require("./util/api")
const wrapDone = require("./util/wrapDone")
const wrapSend = require("./util/wrapSend")

module.exports = (RED) => {
	RED.nodes.registerType("alphavantage-core-stock-intraday", function (config) {

		RED.nodes.createNode(this, config)

		const node = this

		this.on("input", async (msg, send, done) => {

			const Done = wrapDone(node, done)
			const Send = wrapSend(node, send)
			try {

				const apiConfig = RED.nodes.getNode(config.apiConfig)
				const api = apiUtil.setClient(msg.apiKey || apiConfig.apiKey)

				const symbol = msg.symbol || config.symbol
				const interval = msg.interval || config.interval
				const outputSize = msg.outputSize || config.outputSize || "compact"


				if (!symbol || symbol === "") {
					this.warn("Missing \"symbol\" property")
					Done()
					return
				}
				if (!interval || interval === "") {
					this.warn("Missing \"interval\" property")
					Done()
					return
				}

				const intervalStr = interval.toString()

				if (!["1", "5", "15", "30", "60"].includes(intervalStr)) {
					this.warn(`Bad "interval" property, expecting one of 1, 5, 15, 30, 60, got "${intervalStr}"`)
					Done()
					return
				}

				if (outputSize !== "full" && outputSize !== "compact") {
					this.warn(`Bad "outputSize" property, expecting one of "full" or "compact", got "${outputSize}"`)
					Done()
					return
				}

				this.debug(`Requesting stock intraday data for ${symbol} with ${intervalStr} interval`)

				const result = api.util.polish(await api.data.intraday(symbol, outputSize, "json", `${intervalStr}min`))

				const timeSeriesKey = `Time Series (${intervalStr}min)`

				msg.payload = {
					data: apiUtil.mapData(result.meta), // backward compat
					series: apiUtil.mapSeriesObj(result[timeSeriesKey], "Timestamp", result.meta.zone), // backward compat
					seriesArray: apiUtil.mapSeriesArray(result[timeSeriesKey], "Timestamp", result.meta.zone), // new array
				}

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
