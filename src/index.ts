import { Telegraf, Context } from "telegraf"
import dotenv from "dotenv"
import airtable from "airtable"
import axios from "axios"
import cron from "node-cron"
dotenv.config()

if (process.env.BOT_TOKEN === undefined) {
	console.error("BOT_TOKEN is not defined")
	process.exit(1)
}
const bot = new Telegraf(process.env.BOT_TOKEN)

const data = {
	id: 0,
	price: 0,
	notify: false
}
// const base = airtable.base("appsRMkLqL0vmS1li")

// bot.command("watch", async (ctx) => {
// 	const textMsg = ctx.message.text
// 	const userId = ctx.from.id
// 	const cmdRegex = /\/watch (\w+) (\w+) (\d+\.*\d*)/i
// 	const params = cmdRegex.exec(textMsg)
// 	if (params === null) {
// 		ctx.reply("Invalid command")
// 		return
// 	}
// 	const data = {
// 		telegram_id: userId,
// 		from_token: params[1],
// 		to_token: params[2],
// 		network: "Terra",
// 		price: parseFloat(params[3])
// 	}
// 	await base.table("watch_list").create(data)
// 	ctx.reply("Added to watch list")
// })

bot.command("luna", (ctx) => {
	data.id = ctx.from.id
	const params = /\/luna (\d+\.*\d*)/i.exec(ctx.message.text)
	if (params === null) {
		ctx.reply("Invalid command")
		return
	}
	data.price = parseFloat(params[1])
	ctx.reply(`Watching for 1 LUNA >= ${data.price} bLUNA`)
})

bot.command("ping", (ctx) => {
	ctx.reply("pong")
})

const watchPrice = async () => {
	const { data: resData } = await axios.get(
		`https://fcd.terra.dev/wasm/contracts/terra1jxazgm67et0ce260kvrpfv50acuushpjsz2y0p/store?query_msg=%7B%22simulation%22%3A%7B%22offer_asset%22%3A%7B%22amount%22%3A%221000000%22%2C%22info%22%3A%7B%22native_token%22%3A%7B%22denom%22%3A%22uluna%22%7D%7D%7D%7D%7D`
	)

	const price = parseInt(resData.result.return_amount) / 1000000
	if (price >= data.price && !data.notify) {
		await bot.telegram.sendMessage(
			data.id,
			`ALERT 🚨: 1LUNA = ${data.price} bLUNA`
		)
		data.notify = true
	} else if (price < data.price) {
		data.notify = false
	}
}

cron.schedule("* * * * *", watchPrice)

bot.launch({
	webhook: {
		domain: process.env.DOMAIN,
		hookPath: "/webhook",
		port: 3000
	}
})
