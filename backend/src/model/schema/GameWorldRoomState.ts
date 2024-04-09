import { Schema, type , MapSchema} from "@colyseus/schema";
import { PlayerState } from "../PlayerState";

export class GameWorldRoomState extends Schema {
  @type("string") mySynchronizedProperty: string = "Hello world";
  @type({ map: PlayerState }) players = new MapSchema<PlayerState>();
}

