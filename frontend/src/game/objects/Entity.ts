import { Container, ObservablePoint, Observer, Point, Sprite } from "pixi.js";
import { IFollowable } from "./utils/followers/IFollowable";
import { IFollower } from "./utils/followers/IFollower";

export class Entity implements IFollowable<Point>, Observer<ObservablePoint> {
  protected followers: Set<IFollower<Point>> = new Set();

  private sprite!: Sprite;
  private _position: ObservablePoint;
  private _widthLeft: number = 65;
  private _widthRight: number = 50;
  private _heightTop: number = -30;
  private _heightBottom: number = 50;

  constructor(){
    this.sprite = Sprite.from("red"); // will be replaced by smart assets
    this.sprite.scale.set(0.03);
    this.sprite.anchor.set(0.5);

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


  private _setPosition(x: number, y: number) {
    this.sprite.position.set(x, y);
    this._position.set(x, y);
    this.sprite.zIndex = y;
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
    container.addChild(this.sprite);
  }

  removeFromContainer(container: Container) {
    container.removeChild(this.sprite);
  }


  get widthLeft(): number {
    return this._widthLeft;
  }

  get widthRight(): number {
    return this._widthRight;
  }


  get heightTop(): number {
    return this._heightTop;
  }

  get heightBottom(): number {
    return this._heightBottom;
  }
}