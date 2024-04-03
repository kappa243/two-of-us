import { Application, Assets } from "pixi.js";
import { Camera } from "./Camera";
import { Controller, Key } from "./Controller";
import { FollowableBunny } from "./FollowableBunny";
import { FollowableChicken } from "./FollowableChicken";
import { Room } from "colyseus.js";

export class GameBase {

  private app: Application;
  private controller: Controller | null = null;
  private room: Room | null = null;

  private camera!: Camera;

  private _lock: boolean = false;
  private firstBunny?: FollowableBunny;
  private secondBunny?: FollowableChicken;

  private secondBunnyData: number[] = [0,0];

  /**
   * Preloads assets
   */
  private async preload() {
    const assets = [
      { alias: "bunny", src: "https://pixijs.com/assets/bunny.png" },
      { alias: "chicken", src: "https://pixijs.com/assets/eggHead.png" }
    ];

    await Assets.load(assets);
  }

  constructor(app: Application) {
    this.app = app;
  }

  setSecondBunnyPosition(x: number, y: number){
    this.secondBunny!.x = x;
    this.secondBunny!.y = y;
  }

  setSecondBunnyX(x: number){
    this.secondBunnyData[0] = x;
  }

  setSecondBunnyY(y: number){
    this.secondBunnyData[1] = y;
  }

  setRoom(room: Room){
    this.room = room;
  }

  step(percentage: number, min: number, max: number){
      let ratio = (percentage - min) / (max - min);
      return ratio * ratio * (3 - 2 * ratio);
  }

  interpolation(current: number, future: number, percentage: number){
    return (future - current) * this.step(percentage, 0,1) + current;
  }

  async run(a: any) {
    await this.preload();
    console.log(a);

    this.controller = new Controller();
    this.camera = new Camera(this.app);
    this.firstBunny = new FollowableBunny(this.app.screen.width / 2, this.app.screen.height / 2);
    this.secondBunny = new FollowableChicken(25, 25);
    this.firstBunny?.addToContainer(this.camera.container);
    this.secondBunny.addToContainer(this.camera.container);
    
    this.firstBunny!.position.x = this.app.screen.width / 2;
    this.firstBunny!.position.y = this.app.screen.height / 2;
    
    this.camera.setPosition(0, 0);

    this.camera.follow(this.firstBunny!);

    this.app.ticker.add((time) => {

      const bunny = this.camera.followedObject as FollowableBunny;

      bunny.rotation += 0.1 * time.deltaTime;
      // console.log("secondX: ", this.secondBunny!.x )
      this.secondBunny!.x = this.interpolation(this.secondBunny!.x, this.secondBunnyData[0], 0.25);
      this.secondBunny!.y = this.interpolation(this.secondBunny!.y, this.secondBunnyData[1], 0.25);

      // this.secondBunny!.x = this.quadratic(this.secondBunny!.x, this.secondBunnyData[0], 0.2, 0.5);
      // this.secondBunny!.y = this.quadratic(this.secondBunny!.y, this.secondBunnyData[1], 0.2, 0.5);

      // for every Key values change bunny position
      Object.values(Key).filter(v => typeof v === "number").forEach( keyVal => {
        const key = keyVal as Key;

        if (this.controller?.keys[key].pressed) {
          switch (key) {
            case Key.UP:
              bunny.y -= 5 * time.deltaTime;
              break;
            case Key.DOWN:
              bunny.y += 5 * time.deltaTime;
              break;
            case Key.LEFT:
              bunny.x -= 5 * time.deltaTime;
              break;
            case Key.RIGHT:
              bunny.x += 5 * time.deltaTime;
              break;
            case Key.E:
              console.log("pressed E")
              this.room?.send("init", {name: this.room.sessionId, x: 1, y: 1});
              break;
            case Key.Q:
              // swap following bunny
              if (!this._lock){
                this.camera.follow(this.camera.followedObject === this.firstBunny! ? this.secondBunny! : this.firstBunny!);
                this._lock = true;
              }
          }
        }
        // console.log("firstBunny: ",bunny.x, " ", bunny.y);

        if (key === Key.Q && this.controller?.keys[key].pressed === false && this._lock) {
          this._lock = false;
        }
      });


    });
  }

  stop(){
    this.controller?.destructor();
    this.controller = null;
  }
}