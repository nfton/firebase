import * as functions from "firebase-functions";
import {Telegraf} from 'telegraf'

const bot = new Telegraf(functions.config().telegram.token, {
	telegram: {webhookReply: true},
})

bot.start(ctx => {
	ctx.reply("Launch Game by clicking this button:", {
		reply_markup: {
			inline_keyboard: [[{
				web_app: {url: 'https://start.nfton.space'},
				text: "Launch Game"
			}]]
		}
	})
})

export const telegramBot = functions
	.region('europe-west3')
	.https
	.onRequest(async (req, res) => {
		await bot.handleUpdate(req.body, res).then((rv: any) => {
			return !rv && res.status(200).send('ok')
		})
	})