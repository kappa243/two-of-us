import { Room } from "colyseus.js";
import { Point } from "pixi.js";
import { Session } from "./Session";

export class SessionController {

  private room: Room<any>;
  private session: Session;


  constructor(session: Session) {
    this.session = session;
    this.room = this.session.getRoom();

    this.setUp();
  }

  getSessionId() {
    return this.room.sessionId;
  }


  private setUp(){
    
  }


  init(){
    // this.session.send("init", new MessageDataPlayer());
  }

  playerJoinListener(callback: (player: any, key: any) => void) {
    this.room.state.players.onAdd(callback, true);
  }

  playerLeftListener(callback: (player: any, key: any) => void) {
    this.room.state.players.onRemove(callback, false);
  }

  sendPosition(point: Point) {
    this.session.send("movementInput", { "x": point.x, "y": point.y });
  }

}