import * as functions from "firebase-functions";
import {Telegraf} from 'telegraf'
import {ColorsGame, GameType, Join} from "./types";
import * as admin from "firebase-admin"
import {createNewColorGame} from "./games/colors";
import TonWeb from "tonweb";

require("buffer");


const tonweb = new TonWeb();


admin.initializeApp();
const bot = new Telegraf(functions.config().telegram.token, {
	telegram: {webhookReply: true},
})

bot.use(async (ctx, next) => {
	let userRef = admin.firestore().collection("users").doc(ctx.from?.id.toString() || "")
	let userDoc = await userRef.get()
	if (!userDoc.exists) {
		await userRef.set({...(ctx.from || {}), is_new: true, nts: 1000})
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
		let result = await tonweb.getBalance(wallet)
		await admin.firestore().collection('users').doc(ctx.from.id.toString()).update({wallet})
		if (userDoc.get('is_new') === true) {
			// todo: send NTS to wallet
			await admin.firestore().collection('users').doc(ctx.from.id.toString()).update({nts: admin.firestore.FieldValue.increment(100)})
			await ctx.reply('*[Not Actually]* We just transferred you *100 NTS token* to play some games and earn some more', {parse_mode: "Markdown"})

		}
		ctx.reply("*Saved!* Your balance is " + Number(result) / 1000000000 + " TON", {
			parse_mode: 'Markdown',
			reply_markup: {keyboard: [['My wallet']], resize_keyboard: true}
		})
	} catch (e: any) {
		console.error(e);
		ctx.reply('There seems to be an error. Try again or another wallet')
		// not a wallet
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

export const sendGame = functions
	.region('europe-west3')
	.https
	.onCall(async (data) => {
		await bot.telegram.sendMessage(data.id, "You have a new Game. Play it before expires", {
			reply_markup: {
				inline_keyboard: [[{
					text: 'Play',
					web_app: {url: data.url}
				}]]
			}
		})
	})

export const gameOver = functions
	.region('europe-west3')
	.https
	.onCall(async (data) => {
		let res = await admin.firestore().collection("users").doc(data.player.toString()).collection('games').get()
		res.forEach(e => e.ref.delete())
		await admin.firestore().collection("game_colors").doc(data.game).delete()
	})

export const joinWaitRoom = functions
	.region('europe-west3')
	.runWith({maxInstances: 1})
	.https
	.onCall(async (data: Join): Promise<any> => {
		console.log(data)
		if (data.type === GameType.COLORS.toString()) {
			let waitRoomRef = admin.firestore().collection("wait_room_colors")
			if ((await waitRoomRef.doc(data.player.id.toString()).get()).exists ||
				(await admin.firestore().collection("users").doc(data.player.id.toString()).collection('games').where("type", "==", "COLORS").get()).docs.length > 0) {
				return false
			}
			await admin.firestore().collection("users").doc(data.player.id.toString()).update({nts: admin.firestore.FieldValue.increment(-50)})
			let users = await waitRoomRef.get()
			if (users.docs.length === 0) {
				await waitRoomRef.doc(data.player.id.toString()).set({player: data.player})
				return true
			} else if (users.docs.length === 1 && users.docs[0].data().player.id !== data.player.id) {
				await waitRoomRef.doc(users.docs[0].id).delete()
				await createNewColorGame({players: [users.docs[0].data().player, data.player]} as ColorsGame)
				return true
			}
		}
	})


