import { Room, Client } from "@colyseus/core";
import { MyRoomState, Player } from "./schema/MyRoomState";

export class MyRoom extends Room<MyRoomState> {
  maxClients = 4;

  onCreate (options: any) {
    this.setState(new MyRoomState());

    this.onMessage("location2", (client: any, message: any) => {
      console.log("Message arrived! ", message);
      //
      // handle "type" message
      //
      client.send("message_type2", "message");
      this.broadcast("message_type2", "message2");
    });

    this.onMessage("location3001", (client: any, message: any) => {
      console.log("Message 3001 has arrived!", message);
      // console.log("players: ", this.state.players);
      let player = this.state.players.get(message.name);
      if (player !== null) {
        console.log("player new");
        player.x = message.x;
        player.y = message.y;
      }
      // this.state.players.forEach((value: Player) =>{
      //   console.log("Looking for player: ", value.name, " ", message.name);
      //   if (value.name === message.name){
      //     console.log("Player has been found");
      //     value.x = message.x;
      //     value.y = message.y;
      //   }
      // })
      // client.send("message_type2", "message");
      // this.broadcast("location3002", message);
    });

    this.onMessage("init", (client: any, message: any) => {
      console.log("Message 3001 has arrived! ", message);
      // this.state.player_names.push(message.name);
      // let player = new Player(message.x, message.y, message.name);
      // this.state.players.set(message.name, player);
      // console.log("player: ", player)
      // client.send("message_type2", "message");
      // this.broadcast("location3001", message);
    });

  }

  // onMessage(client: any, message: any){
  //   console.log("Received message: ", message);
  //   if (message.type === 'location')
  //     console.log("message: location");
  //   // this.broadcast('message_type2', { text: "hello"});
  //   // client.send("messate_type2", "i am back!");
  //   console.log(client.send);
  // }

  onJoin (client: Client, options: any) {
    console.log(client.sessionId, "joined!");
    this.state.players.set(client.sessionId, new Player(client.sessionId));
    // client.send("messate_type2", "i am back!");
  }

  onLeave (client: Client, consented: boolean) {
    console.log(client.sessionId, "left!");
  }

  onDispose() {
    console.log("room", this.roomId, "disposing...");
  }

}
