"use strict"

const alphavantage = require("alphavantage")
const { DateTime } = require("luxon")

const FLOAT_VARS = ["open", "close", "high", "low", "price", "change", "prev_close"]
const INT_VARS = ["volume"]

var api

function setClient(apiKey) {
	api = alphavantage({ key: apiKey })

	return api
}

function mapData(metadata) {
	return {
		information: metadata.information,
		symbol: metadata.symbol,
		last_refreshed: metadata.updated,
		interval: metadata.interval,
		output_size: metadata.size,
		time_zone: metadata.zone
	}
}

function mapQuoteObj(quoteObj) {
	var returnVar = {}

	Object.keys(quoteObj).forEach((dataPointKey) => {

		if (FLOAT_VARS.includes(dataPointKey)) {
			returnVar[dataPointKey] = parseFloat(quoteObj[dataPointKey])
		} else if (INT_VARS.includes(dataPointKey)) {
			returnVar[dataPointKey] = parseInt(quoteObj[dataPointKey], 10)
		} else if (dataPointKey === "change_percent") {
			returnVar[dataPointKey] = parseFloat(quoteObj[dataPointKey].replace("%",""))/100.0
		} else {
			returnVar[dataPointKey] = quoteObj[dataPointKey]
		}
	})

	return returnVar
}

function mapSeriesObj(seriesObj, timeseriesType, timezone = "US/Eastern") {
	var returnVar = {}
	Object.keys(seriesObj).forEach((key) => {

		var timestamp = DateTime.fromISO(key)
		timestamp = timestamp.setZone(timezone, { keepLocalTime: true })

		var format = "yyyy-MM-dd"

		if (timeseriesType === "Timestamp")
			format = "yyyy-MM-dd HH:mm:ss"

		const seriesKey = timestamp.toFormat(format)
		returnVar[seriesKey] = seriesObj[key]

		Object.keys(seriesObj[key]).forEach((dataPointKey) => {

			if (FLOAT_VARS.includes(dataPointKey)) {
				returnVar[seriesKey][dataPointKey] = parseFloat(seriesObj[key][dataPointKey])
			} else if (INT_VARS.includes(dataPointKey)) {
				returnVar[seriesKey][dataPointKey] = parseInt(seriesObj[key][dataPointKey], 10)
			}
		})

		if (timeseriesType === "Timestamp")
			returnVar[seriesKey].timestamp = timestamp.toISO()
	})

	return returnVar
}

function mapSeriesArray(seriesObj, timeseriesType, timezone = "US/Eastern") {
	const returnVar = []
	Object.keys(seriesObj).forEach((key) => {

		let seriesItem = JSON.parse(JSON.stringify(seriesObj[key])) // deep copy this

		Object.keys(seriesItem).forEach((dataPointKey) => {

			if (FLOAT_VARS.includes(dataPointKey)) {
				seriesItem[dataPointKey] = parseFloat(seriesItem[dataPointKey])
			} else if (INT_VARS.includes(dataPointKey)) {
				seriesItem[dataPointKey] = parseInt(seriesItem[dataPointKey], 10)
			}
		})

		var timestamp = DateTime.fromISO(key)
		timestamp = timestamp.setZone(timezone, { keepLocalTime: true })

		if (timeseriesType === "Timestamp") {
			seriesItem.timestamp = timestamp.toISO()
			seriesItem.datetime = timestamp.toFormat("yyyy-MM-dd HH:mm:ss")
		} else if (timeseriesType === "Date") {
			seriesItem.date = timestamp.toFormat("yyyy-MM-dd")
		}

		returnVar.push(seriesItem)
	})

	return returnVar
}

function processAVError(error) {
	try {
		const regex = /^An AlphaVantage error occurred. (\{{1}.*\}{1})$/
		var errorMessage = JSON.parse(error.name.match(regex)[1])

		return errorMessage.Note

	} catch(e1) {
		return `Cannot dereference ${error.name}: ${e1}..  Original error ${JSON.stringify(error)}`
	}
}

function createEnum(values) {
	const enumObject = {}
	for (const val of values) {
		enumObject[val] = val
	}
	return Object.freeze(enumObject)
}

const timeseriesType = createEnum(["Date", "Timestamp"])

module.exports = {
	setClient,
	mapData,
	mapQuoteObj,
	mapSeriesObj,
	timeseriesType,
	mapSeriesArray,
	processAVError
}