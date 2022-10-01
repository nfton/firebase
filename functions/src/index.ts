import * as functions from "firebase-functions";
import {Telegraf} from 'telegraf'
import {ColorsGame, Game, GameType} from "./types";
import * as admin from "firebase-admin"
import {createNewColorGame} from "./games/colors";
import {Configuration, RawBlockchainApi} from "tonapi-sdk-js";

require("buffer");

const blockchain = new RawBlockchainApi(new Configuration({
	headers: {
		// To get unlimited requests
		Authorization: 'Bearer 5cbe41787f6dbe5c6faa4950ba286792874c8e8ff5b085602bab417f6eb306f5',
	},
}))


admin.initializeApp();
const bot = new Telegraf(functions.config().telegram.token, {
	telegram: {webhookReply: true},
})

bot.use(async (ctx, next) => {
	let userRef = admin.firestore().collection("users").doc(ctx.from?.id.toString() || "")
	let userDoc = await userRef.get()
	if (!userDoc.exists) {
		await userRef.set({...(ctx.from || {}), is_new: true, nts: 0})
	}
	return next()
})

bot.start(async ctx => {
	let userDoc = await admin.firestore().collection("users").doc(ctx.from.id.toString()).get()
	ctx.reply("Welcome to NFTON.space. Play to earn some coins or just have fun", {
		reply_markup: {
			keyboard: [[userDoc.get('wallet') === undefined ? 'Connect a TON wallet' : "My wallet"]],
			resize_keyboard: true
		}
	})
})

bot.hears('Connect a TON wallet', async (ctx) => {
	ctx.reply('Send your **TON wallet address** with\n/setwallet command.\n\nExample: `/setwallet EQAQ6i-LfUZCQwcP7TrpEB8P3jASUzsJoXIaNxzGtwRlwxvV`', {parse_mode: "Markdown"})
})

bot.hears('My wallet', async (ctx) => {
	let userDoc = await admin.firestore().collection("users").doc(ctx.from.id.toString()).get()
	if (userDoc.get('wallet') === undefined) {
		ctx.reply('There is no connected wallet to your account', {
			parse_mode: "Markdown",
			reply_markup: {keyboard: [['Connect a TON wallet']], resize_keyboard: true}
		})
		return;
	}

})

bot.command('setwallet', async (ctx) => {
	let userDoc = await admin.firestore().collection('users').doc(ctx.from.id.toString()).get()
	let wallet = ctx.message.text.split(' ')[1]
	try {
		let account = await blockchain.getAccount({account: wallet})
		let result = account.balance
		await admin.firestore().collection('users').doc(ctx.from.id.toString()).update({wallet})
		if (userDoc.get('is_new') === true) {
			// todo: send NTS to wallet
			await admin.firestore().collection('users').doc(ctx.from.id.toString()).update({nts: admin.firestore.FieldValue.increment(100)})
			await ctx.reply('[Not Actually] We just transferred you *100 NTS token* to play some games and earn some more', {parse_mode: "Markdown"})

		}
		ctx.reply("*Saved!* Your balance is " + Number(result) / 1000000000 + " TON", {
			parse_mode: 'Markdown',
			reply_markup: {keyboard: [['My wallet']], resize_keyboard: true}
		})
	} catch (e: any) {
		ctx.reply('There seems to be an error. Try again or another wallet')
		// not a wallet
		console.error(e);
	}
})

export const telegramBot = functions
	.region('europe-west3')
	.https
	.onRequest(async (req, res) => {
		await bot.handleUpdate(req.body, res).then((rv: any) => {
			return !rv && res.status(200).send('ok')
		})
	})


export const createNewGame = functions
	.region('europe-west3')
	.https
	.onCall(async (data: Game) => {
		console.log(data)
		if (data.type === GameType.COLORS.toString()) {
			await createNewColorGame(data as ColorsGame)
		}
	})


