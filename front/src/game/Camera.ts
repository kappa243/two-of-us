import { Application, Container, Point } from "pixi.js";
import { IFollowable } from "./utils/followers/IFollowable";
import { IFollower } from "./utils/followers/IFollower";

export class Camera implements IFollower<Point> {

  private app: Application;

  /**
   * Camera aware container
   */
  readonly container: Container;

  private _followedObject: IFollowable<Point> | null = null;


  constructor(app: Application) {
    this.app = app;

    // create container that camera will be relative to
    this.container = new Container();

    // add camera to stage 
    // console.log("adding container", this.app);
    this.app.stage.addChild(this.container);
  }

  private init() {
    this.container.interactive = true;
  }

  get positon() {
    return this.container.position;
  }

  private _setPosition(x: number, y: number) {
    this.container.position.set(x, y);
  }

  setPosition(x: number, y: number) {
    this.unfollow();

    this._setPosition(x, y);
  }

  move(x: number, y: number) {
    this.unfollow();

    this._setPosition(this.container.x + x, this.container.y + y);
  }


  /**
   * 
   *  @ignore 
   * 
   *  @param {Point} point - center of followed object
   *  
   * */
  _notify(point: Point): void {
    this._setPosition(-point.x + this.app.screen.width / 2, -point.y + this.app.screen.height / 2);
  }

  follow(followable: IFollowable<Point>) {
    this.unfollow();
    
    this._followedObject = followable;

    followable.subscribe(this);
  }
  
  unfollow(){
    if (this._followedObject) {
      this._followedObject.unsubscribe(this);
      this._followedObject = null;
    }
  }

  get followedObject(): IFollowable<Point> | null {
    return this._followedObject;
  }

}