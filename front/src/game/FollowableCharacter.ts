import { Container, ObservablePoint, Point, Sprite } from "pixi.js";
import { IFollowable } from "./utils/followers/IFollowable";
import { IFollower } from "./utils/followers/IFollower";

export class FollowableCharacter implements IFollowable<Point> {
  private followers: Set<IFollower<Point>> = new Set();

  private character: Sprite;
  private _position: ObservablePoint;


  constructor(x: number, y: number, characterType: number) {
    switch(characterType){
      case 0:
        this.character = Sprite.from("bunny");
          break;
      case 1:
        this.character = Sprite.from("eggHead");
          break;
      case 2:
        this.character = Sprite.from("flowerTop");
          break;
      default:
        this.character = Sprite.from("bunny");
          break;
  }
    this.character.anchor.set(0.5);
    
    this._position = new ObservablePoint(this, x, y);
    this._setPosition(x, y);
  }
  

  /**
   * Updates position of the character
   * @ignore
  */
  _onUpdate(point?: ObservablePoint | undefined) {
    if (point)
      this.followers.forEach(follower => follower._notify(point));
  }

  subscribe(follower: IFollower<Point>): void {
    this.followers.add(follower);
    follower._notify(this._position);
  }
  
  unsubscribe(follower: IFollower<Point>): void {
    this.followers.delete(follower);
  }


  private _setPosition(x: number, y: number) {
    this.character.position.set(x, y);
    this._position.set(x, y);
  }

  get x() {
    return this._position.x;
  }

  get y() {
    return this._position.y;
  }

  set x(x: number) {
    this._setPosition(x, this._position.y);
  }

  set y(y: number) {
    this._setPosition(this._position.x, y);
  }

  get position() {
    return this._position;
  }

  set position(point: Point) {
    this._setPosition(point.x, point.y);
  }

  get rotation() {
    return this.character.rotation;
  }

  set rotation(rotation: number) {
    this.character.rotation = rotation;
  }

  addToContainer(container: Container) {
    container.addChild(this.character);
  }

  removeFromContainer(container: Container) {
    container.removeChild(this.character);
  }
  
}