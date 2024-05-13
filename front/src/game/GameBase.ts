import { Application, Assets, BlurFilter, Container, Graphics, Rectangle, Sprite } from "pixi.js";
import { Camera } from "./Camera";
import { Controller, Key } from "./Controller";
import { FollowableBunny } from "./FollowableBunny";
import { MaskLight } from "./MaskLight";

enum ObstacleType {
  FULL = 1,
  DOUBLE_EDGE = 2
}

enum LayerType {
  TestLayer = 1,
  GeneratedLayer = 2
}

export class GameBase {
  private app: Application;

  private SCREEN_WIDTH = 0;
  private SCREEN_HEIGHT = 0;

  private controller: Controller | null = null;
  private camera!: Camera;

  private _lock: boolean = false;
  private screenObstacles: number[][] = [];
  private posX = 0;
  private posY = 0;
  private delayRenderTime = 50;

  // You can change this to test different scenarios
  private render_parameters = {
    obstacleType: ObstacleType.FULL,
    layerType: LayerType.GeneratedLayer
  };


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

  getRandomInt(max: number) {
    return Math.floor(Math.random() * max) + 10;
  }

  generateMap() {
    let map_layout = [];
    for (let i = 20; i <= this.SCREEN_WIDTH; i += 100) {
      for (let j = 20; j <= this.SCREEN_HEIGHT; j += 100) {
        map_layout.push([i, j, i + this.getRandomInt(70), j + this.getRandomInt(70)]);
      }
    }
    return map_layout;
  }

  testEdgeVision(hiddenContainer: Container, x: number, y: number, obstacleType: ObstacleType) {
    let obs_full = [[100, 100, 120, 120, 120, 100], [300, 300, 350, 350, 350, 300], [200, 250, 250, 300, 250, 250]];
    let obs_double_edge = [[100, 100, 120, 120], [300, 300, 350, 350], [200, 250, 250, 300]];
    if (this.screenObstacles.length === 0) {
      if (obstacleType === ObstacleType.FULL) {
        this.screenObstacles = obs_full;
      }
      else {
        this.screenObstacles = obs_double_edge;
      }
      console.log("Obstacle size: ", this.screenObstacles.length, " points amount: ", this.screenObstacles.length * this.screenObstacles[0].length);
    }
    let obs = this.screenObstacles;
    hiddenContainer.removeChildren();
    obs.forEach((obstacle) => {
      const rect = new Graphics().poly(obstacle).fill({ color: "black" });
      hiddenContainer.addChild(rect);
    });

    let mLight = new MaskLight(obs, this.SCREEN_WIDTH, this.SCREEN_HEIGHT);
    mLight.setPosition(x, y);
    const myPosition = new Graphics().rect(x, y, 10, 10).fill({ color: "green" });
    mLight.createRays();

    let segment: number[] = [];
    mLight.outputPolygon.forEach((point) => {
      segment.push(point[0]);
      segment.push(point[1]);
    });

    const lightPolygon = new Graphics().poly(segment).fill({ color: "white", alpha: 0.5 });

    hiddenContainer.addChild(lightPolygon);
    hiddenContainer.addChild(myPosition);

  }

  private all_segments: number[][] = [];

  onMapEdgeVision(hiddenContainer: Container, x: number, y: number, obstacleType: ObstacleType) {
    if (this.screenObstacles.length === 0) {
      this.screenObstacles = this.generateMap();
      console.log("Obstacle size: ", this.screenObstacles.length, " points amount: ", this.screenObstacles.length * this.screenObstacles[0].length);
    }

    if (hiddenContainer.children.length <= 0) {
      let offset = 10;

      this.screenObstacles.forEach((segment) => {
        if (obstacleType === ObstacleType.FULL) {
          this.all_segments.push([segment[0], segment[1], segment[2], segment[3], segment[2] + offset, segment[3], segment[0] + offset, segment[1]]);
        }
        else {
          this.all_segments.push([segment[0], segment[1], segment[2], segment[3]]);
        }

      });
      this.all_segments.forEach((segment) => {
        const rect = new Graphics().poly(segment).fill({ color: "black" });
        hiddenContainer.addChild(rect);
      });
    }

    let mLight = new MaskLight(this.all_segments, this.SCREEN_WIDTH, this.SCREEN_HEIGHT);
    mLight.setPosition(x, y);
    // const myPosition = new Graphics().rect(140, 140, 10, 10).fill({ color: "green" });
    mLight.createRays();

    let segment2: number[] = [];
    mLight.outputPolygon.forEach((point) => {
      segment2.push(point[0]);
      segment2.push(point[1]);
    });

    const lightPolygon2 = new Graphics().poly(segment2).fill({ color: "white", alpha: 0.5 });
    hiddenContainer.removeChildAt(hiddenContainer.children.length - 1);
    hiddenContainer.addChild(lightPolygon2);

    // hiddenContainer.addChild(myPosition);
  }

  renderFunction(hiddenContainer: Container) {
    let startTime = performance.now();
    if (this.render_parameters.layerType === LayerType.TestLayer) {
      this.testEdgeVision(hiddenContainer, this.posX, this.posY, this.render_parameters.obstacleType);
    }
    else if (this.render_parameters.layerType === LayerType.GeneratedLayer) {
      this.onMapEdgeVision(hiddenContainer, this.posX, this.posY, this.render_parameters.obstacleType);
    }
    let endTime = performance.now();
    console.log("Time to render: ", endTime - startTime, "ms");
  }

  async run(a: any) {
    await this.preload();

    this.controller = new Controller();
    this.camera = new Camera(this.app);
    this.SCREEN_HEIGHT = this.app.screen.height;
    this.SCREEN_WIDTH = this.app.screen.width;
    this.posX = this.SCREEN_WIDTH / 2;
    this.posY = this.SCREEN_HEIGHT / 2;

    const firstBunny = new FollowableBunny(this.posX, this.posY);
    const secondBunny = new FollowableBunny(25, 25);

    firstBunny.addToContainer(this.camera.container);


    // firstBunny.position.x = this.posX;
    // firstBunny.position.y = this.posY;

    this.posX = firstBunny.position.x;
    this.posY = firstBunny.position.y;

    this.camera.setPosition(0, 0);

    this.camera.follow(firstBunny);

    const radius = 250;
    const shiftEdges = 100;

    const hiddenContainer = new Container();
    hiddenContainer.zIndex = 100;
    this.app.stage.addChild(hiddenContainer);

    const edgeContainer = new Container();
    this.camera.container.addChild(edgeContainer);

    this.renderFunction(edgeContainer);

    const darkenLayer = new Graphics().rect(0, 0, this.app.screen.width + 0, this.app.screen.height + 0).fill({ color: 0x000000, alpha: 0.5 });

    hiddenContainer.addChild(darkenLayer);

    const maskDarkLayer = new Graphics()
      .rect(-shiftEdges, -shiftEdges, this.app.screen.width + 2 * shiftEdges, this.app.screen.height + 2 * shiftEdges)
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
      .rect(0, 0, this.app.screen.width, this.app.screen.height)
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
    let beginTime = performance.now();
    this.app.ticker.add((time) => {

      const bunny = this.camera.followedObject as FollowableBunny;

      // for every Key values change bunny position
      Object.values(Key).filter(v => typeof v === "number").forEach(keyVal => {
        const key = keyVal as Key;
        let deltaX = 0;
        let deltaY = 0;

        if (this.controller?.keys[key].pressed) {
          switch (key) {
            case Key.UP:
              bunny.y -= 5 * time.deltaTime;
              deltaY += -5 * time.deltaTime;
              break;
            case Key.DOWN:
              bunny.y += 5 * time.deltaTime;
              deltaY += 5 * time.deltaTime;
              break;
            case Key.LEFT:
              bunny.x -= 5 * time.deltaTime;
              deltaX += -5 * time.deltaTime;
              break;
            case Key.RIGHT:
              bunny.x += 5 * time.deltaTime;
              deltaX += 5 * time.deltaTime;
              break;
            case Key.Q:
              // swap following bunny
              if (!this._lock) {
                this.camera.follow(this.camera.followedObject === firstBunny ? secondBunny : firstBunny);
                this._lock = true;
              }
          }
        }

        // for(let i = 0; i<this.screenObstacles.length; i++){
        //   for(let j = 0; j<this.screenObstacles[i].length; j+=2){
        //     this.screenObstacles[i][j] -= deltaX;
        //     this.screenObstacles[i][j+1] -= deltaY;
        //   }
        // }

        // this.posX += deltaX/500;
        // this.posY += deltaY/500;

        if (key === Key.Q && this.controller?.keys[key].pressed === false && this._lock) {
          this._lock = false;
        }

        if ((deltaX !== 0 || deltaY !== 0) && performance.now() - beginTime > this.delayRenderTime) {
          beginTime = performance.now();

          this.posX = firstBunny.position.x;
          this.posY = firstBunny.position.y;

          this.renderFunction(edgeContainer);

        }

      });

    });
  }

  stop() {
    this.controller?.destructor();
    this.controller = null;
  }
}