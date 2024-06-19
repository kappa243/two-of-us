import { AnimatedSprite, Assets, Container, ObservablePoint, Observer, Point, Sprite, Spritesheet, Texture } from "pixi.js";
import { IFollowable } from "./utils/followers/IFollowable";
import { IFollower } from "./utils/followers/IFollower";

export class Entity implements IFollowable<Point>, Observer<ObservablePoint> {
  protected followers: Set<IFollower<Point>> = new Set();

  protected sprite!: Sprite;
  protected anim!: AnimatedSprite;
  private _position: ObservablePoint;

  private cont!: Container;

  private isMoving: boolean = false;

  constructor(){
    this.sprite = Sprite.from("player"); // will be replaced by smart assets
    this.sprite.scale.set(0.5);
    this.sprite.anchor.set(0.5);

    const playerSheet = new Spritesheet(Texture.from("walk"), Assets.get("walk_json").data);

    const textures = [];
    for (let i = 1; i <= 12; i++) {
      const frameKey = `walk-${i}`;
      const texture = Texture.from(frameKey);
      const time = playerSheet.data.frames[frameKey].duration;

      textures.push({ texture, time });
    }

    this.anim = new AnimatedSprite(textures);

    this.anim.anchor.set(0.5);
    this.anim.scale.set(0.5);
    this.anim.animationSpeed = 2;
    this.anim.position.set(0, 0);
    this.anim.visible = false;

    this._position = new ObservablePoint(this, 0, 0);
    this._setPosition(0, 0);
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


  set moving(value: boolean) {
    this.isMoving = value;
  }

  get moving() {
    return this.isMoving;
  }

  setMoving(value: boolean) {

   
    if (!this.isMoving && value) {
      this.anim.gotoAndPlay(0);
      this.sprite.visible = false;
      this.anim.visible = true;
    } 

    if (this.isMoving && !value) {
      this.sprite.visible = true;
      this.anim.visible = false;
      this.anim.stop();
    }
    
    this.isMoving = value;
  }


  private _setPosition(x: number, y: number) {
    this.sprite.position.set(x, y);
    this.anim.position.set(x, y);
    this._position.set(x, y);
    this.sprite.zIndex = y;
    this.anim.zIndex = y;
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
    return this.sprite.rotation;
  }

  set rotation(rotation: number) {
    this.sprite.rotation = rotation;
  }

  addToContainer(container: Container) {
    this.cont = container;

    container.addChild(this.sprite);
    container.addChild(this.anim);
  }

  removeFromContainer(container: Container) {
    container.removeChild(this.sprite);
    container.removeChild(this.anim);
  }

}