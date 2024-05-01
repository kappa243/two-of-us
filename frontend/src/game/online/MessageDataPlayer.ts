
function getRandomInt(max: number) {
  return Math.floor(Math.random() * max);
}

export class MessageDataPlayer {
  playerName: string | null = null;
  characterType: number = getRandomInt(3);

  constructor(name?: string, characterType?: number) {
    if (typeof name !== "undefined") this.playerName = name;
    if (typeof characterType !== "undefined")
      if (characterType < 3 && characterType >= 0)
        this.characterType = characterType;
  }
}