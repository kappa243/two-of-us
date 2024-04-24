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
    this.position.x = (this.cachedPosition.x - this.position.x) * this.step(percentage, 0, 1) + this.position.x;
    this.position.y = (this.cachedPosition.y - this.position.y) * this.step(percentage, 0, 1) + this.position.y;
  }

  setCachedPosition(position: Point) {
    this.cachedPosition = position;
  }

  setCachedPositionX(x: number) {
    this.cachedPosition.x = x;
  }

  setCachedPositionY(y: number) {
    this.cachedPosition.y = y;
  }
}