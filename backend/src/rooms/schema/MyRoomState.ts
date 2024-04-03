import { Schema, Context, type , MapSchema} from "@colyseus/schema";

export class Player extends Schema {
  @type("number") x: number = 625;
  @type("number") y: number = 270;
  @type("string") name: string;

  constructor(name: string){
    super();
    this.name = name;
  }

  // constructor(x:number, y: number, name: string){
  //   super();
  //   this.x = x;
  //   this.y = y;
  //   this.name = name;
  // }

}

export class MyRoomState extends Schema {
  @type("string") mySynchronizedProperty: string = "Hello world";
  @type({ map: Player }) players = new MapSchema<Player>();

}
