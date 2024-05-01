import { Schema, type } from "@colyseus/schema";

export function getRandomInt(max: number) {
    return Math.floor(Math.random() * max);
};

export class MessageDataPlayer extends Schema {
    @type("string") private playerName: string | null;
    @type("number") private characterType: number;

    constructor(playerName: string, characterType: number){
        super();
        this.playerName = playerName;
        this.characterType = characterType;
    }

    getPlayerName() { return this.playerName; }
    getCharacterType() { return this.characterType; }
};