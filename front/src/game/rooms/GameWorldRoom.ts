import {Room, Client} from "colyseus.js";
import { BACKEND_URL } from "../config";
import { GameBase } from "../GameBase";
import { ConnectionError, ConnectionErrorType } from "../exception/ConnectionError";
import { InitializationError } from "../exception/InitializationError";
import { MessageDataPlayer } from "../MessageDataPlayer";
import { Player } from "../Player";

export class GameWorldRoom {
    private room: Room<any> | null = null;
    private client: Client | null = null;
    private game: GameBase | null = null;

    createClient(game: GameBase){
        this.game = game;
        this.client = new Client(BACKEND_URL);
    }

    async joinRoom(roomName: string) {
        if (this.client === null){
            console.log("Client not connected!");
            throw new ConnectionError(ConnectionErrorType.NotConnected);
        }

        try {
            this.room = await this.client.joinOrCreate(roomName, {});

            // console.log("Connected to the room: ", roomName);

            this.setRoomCallbacks();
        }
        catch(exception){
            console.log("Error: ", exception, " Cannot connect to room: ", roomName);
            if(exception instanceof InitializationError){
                console.log("Cannot set-up room callbacks!");
            }
            else throw new ConnectionError(ConnectionErrorType.FailedToConnect);
        }

        return this.room;
    }

    setRoomCallbacks(){
        if (this.room === null){
            console.log("Room has not been set!");
            throw new InitializationError("Room has not been set!");
        }

        this.room.onMessage("init", (message: any) => {
            this.room!.send("init", new MessageDataPlayer());
        });

    
        this.room.state.players.onAdd((player: any, key:any) => {
            // console.log("a player has joined! ", player.position.x, " ", key);

            var player_loc = new Player(key, player.messageDataPlayer.sessionId, player.messageDataPlayer.characterType);
            player_loc.setPositionX(player.position.x);
            player_loc.setPositionY(player.position.y);
            player_loc.setCachedPositionX(player.position.x);
            player_loc.setCachedPositionY(player.position.y);
            // console.log("addedPlayer: ", player_loc.getPosition(), " ", player_loc.getCachedPosition());
            this.game?.addPlayer(player_loc);

            // if (player.connectionId !== this.room!.sessionId){
            player.listen("position", (value: any, previousValue: number[]) => {
                // console.log("Player position update ", value);
                // player_loc.setCachedPosition(value);
                player_loc.setCachedPositionX(value.x);
                player_loc.setCachedPositionY(value.y);
                // player_loc.setPositionX(value.x);
                // player_loc.setPositionY(value.y);
            });

            // player.onChange( () =>{
            //     console.log("player has changed!");
            // })

            // player.listen("position", (value: [number], previousValue: [number]) => {
                // console.log("position update");
                // this.game?.setSecondBunnyPosition(value);
            // });

            // player.listen("x", (value: number, prevoiusValue: number) => {
            //   console.log("new x: ", value)
            //   this.game?.setSecondBunnyX(value);
            // })

            // player.listen("y", (value: number, previousValue: number)=>{
            //   console.log("new y: ", value);
            //   this.game?.setSecondBunnyY(value);
            // })

        }, false);

    }

}