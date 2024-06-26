import { Client, Room } from "@colyseus/core";
import { MessageDataPlayer } from "../../model/MessageDataPlayer";
import { InputType, PlayerState, Pos } from "../../model/PlayerState";
import { MAX_AMOUNT_CLIENTS_PER_ROOM, PLAYER_SPEED } from "../../model/configuration";
import { GameWorldRoomState } from "../../model/schema/GameWorldRoomState";

export class GameWorldRoom extends Room<GameWorldRoomState> {
  maxClients = MAX_AMOUNT_CLIENTS_PER_ROOM;

  onCreate(options: any) {
    this.setState(new GameWorldRoomState());

    // this.onMessage("init", (client: any, message: any) => {
    //   // console.log("Message init has arrived! ", message);
    //   let messageDataPlayer = new MessageDataPlayer(message.playerName, message.characterType);
    //   let ps = new PlayerState(client.sessionId, messageDataPlayer);
    //   // console.log("player pos: ", ps.position.x," ", ps.position.y);
    //   this.state.players.set(client.sessionId, ps);
    // });

    // this.onMessage("location2", (client: any, message: any) => {
    //   console.log("Message arrived! ", message);
    //   client.send("message_type2", "message");
    //   this.broadcast("message_type2", "message2");
    // });

    this.onMessage("movementInput", (client: any, message: any) => {
      // console.log("Player input has arrived! ", message);
      let playerState = this.state.players.get(client.sessionId);
      // player.inputQueue.push(message);
      playerState.position = new Pos(message.x, message.y);
      // playerState.position.x = message.x;
    });

    this.onMessage("movementSide", (client: any, message: any) => {
      let playerState = this.state.players.get(client.sessionId);
      playerState.side = message.side;
    });

    this.onMessage("isMoving", (client: any, message: any) => {
      let playerState = this.state.players.get(client.sessionId);
      playerState.isMoving = message.isMoving;
    });

    // this.onMessage("players", (client: any, message: any) => {
    // console.log("Message 3001 has arrived!", message);
    // console.log("Q: ", this.state.players.size);
    // console.log(this.state.players);
    // });


    // this.onMessage("location3001", (client: any, message: any) => {
    //   console.log("Message 3001 has arrived!", message);

    //   let player = this.state.players.get(message.name);
    //   if (player !== null) {
    //     console.log("player new");
    //     player.position.setAt(0, message.x);
    //     player.position.setAt(1, message.y);
    //   }

    // });

    // this.setSimulationInterval((deltaTime) => {
    //   console.log("setSimulationInterval");
    //   this.update(deltaTime);
    // });

  }
 
  private getFreeColor(players: Map<string, PlayerState>): number {
    let colors = new Set<number>([0, 1, 2, 3, 4]);
    players.forEach((player: PlayerState) => {
      colors.delete(player.color);
    });

    return colors.values().next().value;
  }


  onJoin(client: Client, options: any) {
    console.log(client.sessionId, "joined!");
    // this.state.players.set(client.sessionId, new Player(client.sessionId));
    // console.log("Message init has arrived! ", message);
    let messageDataPlayer = new MessageDataPlayer("dsf", 1);

    let color = this.getFreeColor(this.state.players);

    let ps = new PlayerState(client.sessionId, messageDataPlayer, color);
    // console.log("player pos: ", ps.position.x," ", ps.position.y);
    this.state.players.set(client.sessionId, ps);

    client.send("init", "message_init");
  }

  update(deltaTime: number) {
    console.log("delta time: ", deltaTime);

    this.state.players.forEach((player: PlayerState) => {
      let input: InputType;

      while (input = player.inputQueue.shift()) {
        if (input as InputType === InputType.UP) {
          player.position.y -= PLAYER_SPEED * deltaTime;
        }
        else if (input === InputType.DOWN) {
          player.position.y += PLAYER_SPEED * deltaTime;
        }
        else if (input === InputType.RIGHT) {
          player.position.x -= PLAYER_SPEED * deltaTime;
        }
        else if (input === InputType.LEFT) {
          player.position.x += PLAYER_SPEED * deltaTime;
        }
      }
    });
  }

  onLeave(client: Client, consented: boolean) {
    console.log(client.sessionId, "left!");
    this.state.players.delete(client.sessionId);
  }

  onDispose() {
    console.log("room", this.roomId, "disposing...");
  }

}
