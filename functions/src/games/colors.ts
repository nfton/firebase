import {ColorsGame, ColorsGameResult, ColorsResult, GameType} from "../types";
import * as admin from "firebase-admin";

export async function createNewColorGame(data: ColorsGame) {
	if (data.players.length !== 2) return "ERROR: there must be 2 players"
	let {result} = await generateResult()
	const ref = await admin.firestore().collection("game_colors").add({
		...data,
		result,
		created: new Date().toISOString()
	})
	await admin.firestore().collection("users").doc(data.players[0].id.toString()).collection("games").add({
		id: ref.id,
		type: GameType.COLORS
	})
	await admin.firestore().collection("users").doc(data.players[1].id.toString()).collection("games").add({
		id: ref.id,
		type: GameType.COLORS
	})
	return ref.id
}


async function generateResult(n: number = 20): Promise<ColorsGameResult> {
	let array = Object.keys(ColorsResult)
	let result = []
	for (let i = 0; i < n; i++) {
		let item = array[Math.floor(Math.random() * 6 + 6)];
		result.push(item)
	}
	return {result}
}