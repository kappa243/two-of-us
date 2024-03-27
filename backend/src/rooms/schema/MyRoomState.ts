import { Schema, Context, type } from "@colyseus/schema";

export class Player extends Schema {
  @type("number") x: number;
  @type("number") y: number;
}

export class MyRoomState extends Schema {

  @type("string") mySynchronizedProperty: string = "Hello world";

}
