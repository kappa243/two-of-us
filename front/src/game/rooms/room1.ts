import {Room, Client} from "colyseus.js";
import { BACKEND_URL } from "../config";

export class Room1 {
    room?: Room<any>;

    async create(){
        await this.connect();

        this.room?.state.players.onAdd((player: any, sessionId: any) => {
            player.onChange( () =>{
                console.log("player has changed!");
            })
        });
    }

    async connect() {
        const client = new Client(BACKEND_URL);
        try {
            this.room = await client.joinOrCreate("my_room1", {});
            console.log("Connected to the room: my_room1");
        }
        catch(e){
            console.log("Cannot connect to room: my_room1");
            console.log(e);
        }
    }

}