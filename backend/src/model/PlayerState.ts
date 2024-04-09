import { Schema, type, ArraySchema } from "@colyseus/schema";
import { MessageDataPlayer, getRandomInt } from "./MessageDataPlayer";

export enum InputType {
  UP = 0,
  DOWN,
  RIGHT,
  LEFT
};

export class Pos extends Schema{
  @type("number") x: number;
  @type("number") y: number;
  constructor(x: number, y: number){
    super();
    this.x = x;
    this.y = y;
  }
}

export class PlayerState extends Schema {
    @type("string") connectionId: string;
    // @type([ "number" ]) position: ArraySchema<number> = new ArraySchema<number>(getRandomInt(300), getRandomInt(300));
    @type(Pos) position: Pos = new Pos(getRandomInt(300), getRandomInt(300));
    // @type("number") x: number = getRandomInt(300);
    // @type("number") y: number = getRandomInt(300);
    @type(MessageDataPlayer) messageDataPlayer: MessageDataPlayer;
    inputQueue: InputType[] = [];

    constructor(connectionId: string, messageDataPlayer: MessageDataPlayer){
      super();
      this.connectionId = connectionId;
      this.messageDataPlayer = messageDataPlayer;
    }

}