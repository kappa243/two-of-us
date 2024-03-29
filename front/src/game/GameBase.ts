import { Application, Assets } from "pixi.js";
import { Camera } from "./Camera";
import { Controller, Key } from "./Controller";
import { FollowableBunny } from "./FollowableBunny";

export class GameBase {

  private app: Application;
  private controller: Controller | null = null;

  private camera!: Camera;

  private _lock: boolean = false;

  /**
   * Preloads assets
   */
  private async preload() {
    const assets = [
      { alias: "bunny", src: "https://pixijs.com/assets/bunny.png" }
    ];

    await Assets.load(assets);
  }

  constructor(app: Application) {
    this.app = app;
  }

  async run(a: any) {
    await this.preload();
    console.log(a);

    this.controller = new Controller();
    this.camera = new Camera(this.app);

    const firstBunny = new FollowableBunny(this.app.screen.width / 2, this.app.screen.height / 2);
    const secondBunny = new FollowableBunny(25, 25);

    firstBunny.addToContainer(this.camera.container);
    secondBunny.addToContainer(this.camera.container);

    firstBunny.position.x = this.app.screen.width / 2;
    firstBunny.position.y = this.app.screen.height / 2;
    
    this.camera.setPosition(0, 0);

    this.camera.follow(firstBunny);

    this.app.ticker.add((time) => {

      const bunny = this.camera.followedObject as FollowableBunny;

      bunny.rotation += 0.1 * time.deltaTime;

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
            case Key.Q:
              // swap following bunny
              if (!this._lock){
                this.camera.follow(this.camera.followedObject === firstBunny ? secondBunny : firstBunny);
                this._lock = true;
              }
          }
        }

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