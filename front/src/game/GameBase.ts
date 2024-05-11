import { Application, Assets, BlurFilter, Container, Graphics, Rectangle, Sprite } from "pixi.js";
import { Camera } from "./Camera";
import { Controller, Key } from "./Controller";
import { FollowableBunny } from "./FollowableBunny";
import { get, map } from "lodash";
import { runInThisContext } from "vm";
import { MaskLight } from "./MaskLight";

export class GameBase {
  private app: Application;

  private SCREEN_WIDTH = 0;
  private SCREEN_HEIGHT = 0;

  private controller: Controller | null = null;
  private camera!: Camera;

  private _lock: boolean = false;
  // private screenObstacles: number[][] = [[100,100,120,120,120,100],[300,300,350,350,350,300],[200,250,250,300,250,250]];
  private screenObstacles: number[][] = [[100,100,120,120],[300,300,350,350],[200,250,250,300]];
  private posX = 0; //this.SCREEN_WIDTH/2;
  private posY = 0; //this.SCREEN_HEIGHT/2;
  private layout: number[][] = [];

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
    return Math.floor(Math.random() * max)+10;
  }

  generateMap(){
    let map_layout = []
    for (let i = 20; i <= this.SCREEN_WIDTH; i+= 100){
      for (let j = 20; j <= this.SCREEN_HEIGHT; j+= 100){
        map_layout.push([i, j, i+this.getRandomInt(70), j+this.getRandomInt(70)]);
      }
    }
    return map_layout;
  }

  testEdgeVision(hiddenContainer: Container, x: number, y: number){
    // let obs = [[100,100,120,120,120,100],[300,300,350,350,350,300],[200,250,250,300,250,250]];
    let obs = this.screenObstacles;
    hiddenContainer.removeChildren();
    obs.forEach( (obstacle) => {
      const rect = new Graphics().poly(obstacle).fill({ color: "black" });
      hiddenContainer.addChild(rect);
    });
    // return;

    let mLight = new MaskLight(obs, this.SCREEN_WIDTH, this.SCREEN_HEIGHT);
    mLight.setPosition(x,y);
    const myPosition = new Graphics().rect(x,y, 10, 10).fill({ color: "green"});
    mLight.createRays();
    // console.log("Output polygon: ", mLight.outputPolygon);
    let segment: number[] = [];
    mLight.outputPolygon.forEach( (point) => {
      segment.push(point[0]);
      segment.push(point[1]);
    });

    const lightPolygon = new Graphics().poly(segment).fill({ color: "white", alpha: 0.5});

    hiddenContainer.addChild(lightPolygon);
    hiddenContainer.addChild(myPosition);

  }

  onMapEdgeVision(hiddenContainer: Container, x: number, y: number){
    if(this.layout.length === 0){
      this.layout = this.generateMap();
      this.screenObstacles = this.layout;
    }
    hiddenContainer.removeChildren();
    let offset = 4;
    let all_segments: number[][] = [];
    this.layout.forEach( (segment) => {
      all_segments.push([segment[0], segment[1], segment[2], segment[3]]);
      // all_segments.push([segment[0], segment[1], segment[2], segment[3], segment[2] + offset, segment[3], segment[0]+offset, segment[1]]);
    });
    all_segments.forEach( (segment) => {
      const rect = new Graphics().poly(segment).fill({ color: "black" });
      hiddenContainer.addChild(rect);
    });
    // return;

    // console.log("Layout: ", layout)
    let mLight = new MaskLight(all_segments, this.SCREEN_WIDTH, this.SCREEN_HEIGHT);
    mLight.setPosition(this.SCREEN_WIDTH/2, this.SCREEN_HEIGHT/2);
    const myPosition = new Graphics().rect(140,140, 10, 10).fill({ color: "green"});
    mLight.createRays();
    // console.log("Output polygon: ", mLight2.outputPolygon);
    let segment2: number[] = [];
    mLight.outputPolygon.forEach( (point) => {
      segment2.push(point[0]);
      segment2.push(point[1]);
    });

    const lightPolygon2 = new Graphics().poly(segment2).fill({ color: "white", alpha: 0.5});
    hiddenContainer.addChild(lightPolygon2);
    hiddenContainer.addChild(myPosition);
  }


  async run(a: any) {
    await this.preload();
    // console.log(a);

    this.controller = new Controller();
    this.camera = new Camera(this.app);
    this.SCREEN_HEIGHT = this.app.screen.height;
    this.SCREEN_WIDTH = this.app.screen.width;
    this.posX = this.SCREEN_WIDTH/2;
    this.posY = this.SCREEN_HEIGHT/2;

    const firstBunny = new FollowableBunny(this.posX, this.posY);
    const secondBunny = new FollowableBunny(25, 25);

    firstBunny.addToContainer(this.camera.container);
    // secondBunny.addToContainer(this.camera.container);

    firstBunny.position.x = this.posX; // this.app.screen.width / 2;
    firstBunny.position.y = this.posY; // this.app.screen.height / 2;
    
    // this.camera.setPosition(0, 0);

    this.camera.follow(firstBunny);

    const radius = 250;
    const shiftEdges = 100;

    const hiddenContainer = new Container();
    hiddenContainer.zIndex = 100;
    this.app.stage.addChild(hiddenContainer);
    let startTime = performance.now();
    // this.testEdgeVision(hiddenContainer, this.posX, this.posY);
    this.onMapEdgeVision(hiddenContainer, this.posX, this.posY);
    let endTime = performance.now();
    console.log("Time: ", endTime - startTime);
    const darkenLayer = new Graphics().rect(0, 0, this.app.screen.width + 0, this.app.screen.height + 0).fill({ color: 0x000000, alpha: 0.5 });

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
    let beginTime = performance.now();
    this.app.ticker.add((time) => {
      
      const bunny = this.camera.followedObject as FollowableBunny;
      
      // focus1.x = this.app.screen.width / 2 - bunny.x;
      // focus1.y = this.app.screen.height / 2 - bunny.y;
      
      // console.log(this.camera.filterContainer.getBounds());
      
      // bunny.rotation += 0.1 * time.deltaTime;

      // for every Key values change bunny position
      Object.values(Key).filter(v => typeof v === "number").forEach( keyVal => {
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
              if (!this._lock){
                this.camera.follow(this.camera.followedObject === firstBunny ? secondBunny : firstBunny);
                this._lock = true;
              }
          }
        }

        for(let i = 0; i<this.screenObstacles.length; i++){
          for(let j = 0; j<this.screenObstacles[i].length; j+=2){
            this.screenObstacles[i][j] -= deltaX;
            this.screenObstacles[i][j+1] -= deltaY;
          }
        }

        this.posX += deltaX/500;
        this.posY += deltaY/500;

        if (key === Key.Q && this.controller?.keys[key].pressed === false && this._lock) {
          this._lock = false;
        }

        if((deltaX !== 0 || deltaY !== 0) && performance.now() - beginTime > 10){
          beginTime = performance.now();
          let startTime = performance.now();
          // this.testEdgeVision(hiddenContainer, this.posX, this.posY);
          this.onMapEdgeVision(hiddenContainer, this.posX, this.posY);
          let endTime = performance.now();
          console.log("Time test: ", endTime - startTime);
        }

      });

    });
  }

  stop(){
    this.controller?.destructor();
    this.controller = null;
  }
}