import { ColorReplaceFilter } from "pixi-filters";
import { Graphics, Point } from "pixi.js";
import { MessageDataPlayer } from "../online/MessageDataPlayer";
import { Entity } from "./Entity";
import { Container } from "pixi.js";

export class Player extends Entity {

  readonly sessionId: string;
  private messageDataPlayer: MessageDataPlayer;

  private cachedPosition: Point;

  // transform to common schema player state
  constructor(sessionId: string, color: number, playerName?: string, characterType?: number) {
    super();

    this.sessionId = sessionId;
    this.messageDataPlayer = new MessageDataPlayer(playerName, characterType);

    this.cachedPosition = new Point();
    this.cachedPosition.copyFrom(this.position);

    // change player color
    this.changeColor(color);
  }

  setMask(mask: Container | Graphics) {
    this.sprite.mask = mask;
    this.anim.mask = mask;
  }

  private changeColor(color: number) {
    let filterRed1 = new ColorReplaceFilter({
      originalColor: [1, 0, 0],
      targetColor: [0, 0, 0],
      tolerance: 0.4
    });
    let filterRed2 = new ColorReplaceFilter({
      originalColor: [0.8, 0, 0],
      targetColor: [0, 0, 0],
      tolerance: 0.3
    });


    let filterRedBlue1 = new ColorReplaceFilter({
      originalColor: [0.85, 0, 0.45],
      targetColor: [0, 0, 0],
      tolerance: 0.238
    });
    let filterRedBlue2 = new ColorReplaceFilter({
      originalColor: [0.5, 0, 0.5],
      targetColor: [0, 0, 0],
      tolerance: 0.325
    });
    let filterRedBlue3 = new ColorReplaceFilter({
      originalColor: [0.45, 0, 0.85],
      targetColor: [0, 0, 0],
      tolerance: 0.238
    });
    
    let filterBlue1 = new ColorReplaceFilter({
      originalColor: [0, 0, 1],
      targetColor: [0, 0, 0],
      tolerance: 0.4
    });
    let filterBlue2 = new ColorReplaceFilter({
      originalColor: [0, 0, 0.8],
      targetColor: [0, 0, 0],
      tolerance: 0.3
    });

    let filterGreen1 = new ColorReplaceFilter({
      originalColor: [0, 1, 0],
      targetColor: 0x7cedff,
      tolerance: 0.4
    });
    let filterGreen2 = new ColorReplaceFilter({
      originalColor: 0x007e00,
      targetColor: 0x30e2ff,
      tolerance: 0.25
    });

    let base, dark;
    switch (color) {
      case 0:
        base = 0xff0000;
        dark = 0x7e0000;

        filterRed1.targetColor = base;
        filterRed2.targetColor = base;

        filterBlue1.targetColor = dark;
        filterBlue2.targetColor = dark;

        filterRedBlue1.targetColor = dark;
        filterRedBlue2.targetColor = dark;
        filterRedBlue3.targetColor = dark;
        break;
      
      case 1:
        base = 0x000080;
        dark = 0x0000ad;

        filterRed1.targetColor = base;
        filterRed2.targetColor = base;

        filterBlue1.targetColor = dark;
        filterBlue2.targetColor = dark;

        filterRedBlue1.targetColor = dark;
        filterRedBlue2.targetColor = dark;
        filterRedBlue3.targetColor = dark;
        break;

      default:
        base = 0x00ff00;
        dark = 0x009e00;

        filterRed1.targetColor = base;
        filterRed2.targetColor = base;

        filterBlue1.targetColor = dark;
        filterBlue2.targetColor = dark;

        filterRedBlue1.targetColor = dark;
        filterRedBlue2.targetColor = dark;
        filterRedBlue3.targetColor = dark;
        break;
    }

    const filters = [filterGreen1, filterGreen2, filterRedBlue1, filterRedBlue2, filterRedBlue3, filterRed1, filterRed2, filterBlue1, filterBlue2];
    this.anim.filters = filters;
    this.sprite.filters = filters;

  }

  private step(percentage: number, min: number, max: number) {
    let ratio = (percentage - min) / (max - min);
    return ratio * ratio * (3 - 2 * ratio);
  }

  setSide(side: number) {
    this.sprite.scale.x = Math.abs(this.sprite.scale.x) * side;
    this.anim.scale.x = Math.abs(this.anim.scale.x) * side;
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