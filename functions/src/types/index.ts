export interface Ability {
	strength: number
	health: number
	speed: number
	time: number
}

export interface Player {
	id: number
	ability: Ability
}

export enum GameType {
	COLORS = "COLORS"
}

export enum ColorsResult {
	YELLOW,
	RED,
	BLUE,
	BLACK,
	WHITE,
	GREEN,
	ORANGE,
}

export interface Game {
	type: GameType
}

export interface ColorsGameResult {
	result: string[]
}

export interface ColorsGame extends Game {
	players: Player[]
	result: ColorsGameResult
}