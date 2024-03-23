import { Application, Assets, BlurFilter, Container, Graphics, Rectangle, Sprite } from "pixi.js";
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

    const radius = 250;
    const shiftEdges = 100;

    const hiddenContainer = new Container();
    hiddenContainer.zIndex = 100;

    const darkenLayer = new Graphics().rect(0, 0, this.app.screen.width + 0, this.app.screen.height + 0).fill({ color: 0x000000, alpha: 0.5 });

    this.app.stage.addChild(hiddenContainer);
    hiddenContainer.addChild(darkenLayer);

    const maskDarkLayer = new Graphics()
      .rect(-shiftEdges, -shiftEdges, this.app.screen.width + 2*shiftEdges, this.app.screen.height + 2*shiftEdges)
      .fill({ color: 0xff0000 })
      .circle(this.app.screen.width / 2 + 0, this.app.screen.height / 2 + 0, radius)
      .cut();


    const blurDarkLayer = new BlurFilter({
      kernelSize: 9,
      quality: 64,
      strength: 64,
    });
    blurDarkLayer.repeatEdgePixels = false;

    maskDarkLayer.filters = [blurDarkLayer];

    const bounds = new Rectangle(0, 0, this.app.screen.width, this.app.screen.height);
    const texture = this.app.renderer.generateTexture({
      target: maskDarkLayer,
      resolution: 1,
      frame: bounds,
    });
    const focusDarkLayer = new Sprite(texture);
    this.app.stage.addChild(focusDarkLayer);
    darkenLayer.mask = focusDarkLayer;

    
    const maskGame = new Graphics()
      .rect(0,0, this.app.screen.width, this.app.screen.height)
      .fill({ color: 0x500000 })
      .circle(this.app.screen.width / 2, this.app.screen.height / 2, radius)
      .fill({ color: 0xff0000 });

    const blurGame = new BlurFilter({
      kernelSize: 9,
      quality: 64,
      strength: 64,
    });

    maskGame.filters = [blurGame];

    const boundsGame = new Rectangle(0, 0, this.app.screen.width, this.app.screen.height);
    const textureGame = this.app.renderer.generateTexture({
      target: maskGame,
      resolution: 1,
      frame: boundsGame,
    });
    const focusGame = new Sprite(textureGame);
    this.app.stage.addChild(focusGame);
    this.camera.filterContainer.mask = focusGame;
    
    this.app.ticker.add((time) => {
      
      const bunny = this.camera.followedObject as FollowableBunny;
      
      // focus1.x = this.app.screen.width / 2 - bunny.x;
      // focus1.y = this.app.screen.height / 2 - bunny.y;
      
      // console.log(this.camera.filterContainer.getBounds());
      
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