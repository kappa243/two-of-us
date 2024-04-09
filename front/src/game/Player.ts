import { MessageDataPlayer } from "./MessageDataPlayer";
import { IFollowable } from "./utils/followers/IFollowable";
import { Container, ObservablePoint, Point, Sprite } from "pixi.js";
import { Camera } from "./Camera";
import { FollowableCharacter } from "./FollowableCharacter";
import { InitializationError } from "./exception/InitializationError";

export class Pos{
    x:number = -1;
    y:number = -1;
}

export class Player {
    private sessionId: string;
    private position: Pos;
    private cachedPosition: Pos;
    private messageDataPlayer: MessageDataPlayer;
    followable: FollowableCharacter | null = null;

    constructor(sessionId: string, playerName?: string, characterType?: number) {
        this.sessionId = sessionId;
        this.position = {"x": -1, "y": -1};
        this.cachedPosition = {"x": -1, "y": -1};
        this.messageDataPlayer = new MessageDataPlayer(playerName, characterType);
    }


    getPosition(){
        return this.position;
    }

    getCachedPosition(){
        return this.cachedPosition;
    }

    getPositionX(){
        // return this.x;
        return this.position.x;
    }

    getPositionY(){
        return this.position.y;
    }

    setPositionX(x: number){
        this.position.x = x;
    }

    setPositionY(y: number){
        this.position.y = y;
    }

    setCachedPosition(position: Pos){
        this.cachedPosition = position;
    }

    setCachedPositionX(x: number){
        this.cachedPosition.x = x;
    }

    setCachedPositionY(y: number){
        this.cachedPosition.y = y;
    }

    getSessionId(){
        return this.sessionId;
    }

    setFollowable(camera: Camera){
        if (this.position.x === -1 && this.position.y === -1){
            throw new InitializationError("Not initialized position!");
        }
        
        this.followable = new FollowableCharacter(this.position.x!,
                                this.position.y!, this.messageDataPlayer.characterType);
        this.followable.addToContainer(camera.container);   
    }

    private step(percentage: number, min: number, max: number) {
        let ratio = (percentage - min) / (max - min);
        return ratio * ratio * (3 - 2 * ratio);
    }

    interpolate(percentage: number) {
        this.position.x = (this.cachedPosition.x - this.position.x) * this.step(percentage, 0, 1) + this.position.x;
        this.position.y = (this.cachedPosition.y - this.position.y) * this.step(percentage, 0, 1) + this.position.y;
    }

};