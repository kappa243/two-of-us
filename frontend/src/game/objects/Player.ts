import { Point } from "pixi.js";
import { MessageDataPlayer } from "../online/MessageDataPlayer";
import { Entity } from "./Entity";

export class Player extends Entity {

  readonly sessionId: string;
  private messageDataPlayer: MessageDataPlayer;

  private cachedPosition: Point;

  // transform to common schema player state
  constructor(sessionId: string, playerName?: string, characterType?: number) {
    super();

    this.sessionId = sessionId;
    this.messageDataPlayer = new MessageDataPlayer(playerName, characterType);

    this.cachedPosition = this.position.clone();
  }

  private step(percentage: number, min: number, max: number) {
    let ratio = (percentage - min) / (max - min);
    return ratio * ratio * (3 - 2 * ratio);
  }

  interpolate(percentage: number) {
    this.x = (this.cachedPosition.x - this.x) * this.step(percentage, 0, 1) + this.x;
    this.y = (this.cachedPosition.y - this.y) * this.step(percentage, 0, 1) + this.y;
  }

  setCachedPosition(position: Point) {
    this.cachedPosition = position.clone();
  }

  setCachedPositionX(x: number) {
    this.cachedPosition.x = x;
  }

  setCachedPositionY(y: number) {
    this.cachedPosition.y = y;
  }

  destructor() {
    this.followers.forEach(follower => follower.unfollow());
  }
}