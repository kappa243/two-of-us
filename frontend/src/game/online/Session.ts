import { Client, Room } from "colyseus.js";
import { BACKEND_URL } from "../../config";
import { ConnectionError, ConnectionErrorType } from "../exception/ConnectionError";
import { InitializationError } from "../exception/InitializationError";

export class Session {
  private room: Room<any> | null = null;
  private client: Client | null = null;

  createClient() {
    this.client = new Client(BACKEND_URL);
  }

  async joinRoom(roomName: string) {
    if (this.client === null) {
      console.log("Client not connected!");
      throw new ConnectionError(ConnectionErrorType.NotConnected);
    }

    try {
      this.room = await this.client.joinOrCreate(roomName, {});

      
    }
    catch (exception) {
      console.log("Error: ", exception, " Cannot connect to room: ", roomName);
      if (exception instanceof InitializationError) {
        console.log("Cannot set-up room callbacks!");
      }
      else throw new ConnectionError(ConnectionErrorType.FailedToConnect);
    }

    // this.room?.onMessage("init", (message: any) => {
    //   this.room?.send("init", new MessageDataPlayer());
    // });
  }

  async leaveRoom() {
    this.room?.leave();
  }


  send(type: string | number, message?: any) {
    // create async send
    this.room?.send(type, message);
  }

  getRoom(): Room<any> {
    if (this.room === null) {
      throw new InitializationError("Room has not been set!");
    }

    return this.room;
  }

}