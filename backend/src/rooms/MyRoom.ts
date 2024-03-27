import { Room, Client } from "@colyseus/core";
import { MyRoomState } from "./schema/MyRoomState";

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
      console.log("Message 3001 has arrived! ", message);
      // client.send("message_type2", "message");
      this.broadcast("location3001", message);
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
  }

  onLeave (client: Client, consented: boolean) {
    console.log(client.sessionId, "left!");
  }

  onDispose() {
    console.log("room", this.roomId, "disposing...");
  }

}
