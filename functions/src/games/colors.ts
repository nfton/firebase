import {ColorsGame, ColorsGameResult, ColorsResult} from "../types";
import * as admin from "firebase-admin";

export async function createNewColorGame(data: ColorsGame) {
	if (data.players.length !== 2) return "ERROR: there must be 2 players"
	let {result} = await generateResult()
	const ref = await admin.firestore().collection("game_colors").add({...data, result})
	return ref.id
}


async function generateResult(n: number = 20): Promise<ColorsGameResult> {
	let array = Object.keys(ColorsResult)
	let result = []
	for (let i = 0; i < n; i++) {
		let item = array[Math.floor(Math.random() * array.length)];
		result.push(item)
	}
	return {result}
}