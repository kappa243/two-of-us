import { MAP_BOTTOM_Y, MAP_TOP_Y, PLAYER_SPEED } from "@/config";
import { Sound } from "@pixi/sound";
import { Camera } from "./Camera";
import { Key, KeyboardController } from "./controls/KeyboardController";
import { Player } from "./objects/Player";
import { SessionController } from "./online/SessionController";
import { Wall } from "@/game/utils/Wall";
import { WallProvider } from "@/game/utils/WallProvider";
import { WallHelpers } from "@/game/utils/WallHelpers";
import { MaskLight } from "./vision/MaskLight";
import { Application, Assets, BlurFilter, Container, Graphics, Rectangle, Sprite, Point, Text, closePointEps, Ticker} from "pixi.js";
import { off } from "process";
// TODO move to movement class

const UP_VECTOR = new Point(0, -1);
const DOWN_VECTOR = new Point(0, 1);
const LEFT_VECTOR = new Point(-1, 0);
const RIGHT_VECTOR = new Point(1, 0);

const lines = WallProvider.getWalls();

const sum_vectors = (v1: Point, v2: Point) => {
  return new Point(v1.x + v2.x, v1.y + v2.y);
};

const normalize_vector = (v: Point) => {
  let length = Math.sqrt(v.x * v.x + v.y * v.y);
  if (length === 0) {
    return new Point(0, 0);
  }
  return new Point(v.x / length, v.y / length);
};

const multiply_vector = (v: Point, scalar: number) => {
  return new Point(v.x * scalar, v.y * scalar);
};

const length_vector = (v: Point) => {
  return Math.sqrt(v.x * v.x + v.y * v.y);
};


export class GameManager {
  private app: Application;
  private sessionController: SessionController;

  private controller: KeyboardController;
  private camera: Camera;

  // layers
  private backgroundContentContainer!: Container;
  private gameContentContainer!: Container;
  private foregroundContentContainer!: Container;
  private hiddenContainer = new Container();
  private visionContainer = new Container();
  private obstacleContainer = new Container();

  private screenObstacles: any[] = [];
  private all_segments: number[][] = [];
  private mLight!: MaskLight;
  private SCREEN_WIDTH = 0;
  private SCREEN_HEIGHT = 0;
  private radius = 350;
  private actual_borders: number[] = [];
  private map_walls = WallProvider.getVisionWalls();
  private shiftEdges = 3000;

  private uiContainer!: Container;
  private overlayContainer!: Container;

  private players: Map<string, Player>;
  private local_player: Player | null = null;

  private nLastTime: number = 0;

  private sLastTime: number = 0;
  private walkSounds: any;

  constructor(app: Application, sessionController: SessionController, controller: KeyboardController, camera: Camera) {
    this.app = app;
    this.sessionController = sessionController;

    this.controller = controller;
    this.camera = camera;

    this.setupContainers();
    this.setupVisionLayers();
    this.SCREEN_WIDTH = this.app.screen.width;
    this.SCREEN_HEIGHT = this.app.screen.height;

    this.players = new Map<string, Player>();

    this.registerListeners();

    this.walkSounds = [
      Sound.from("assets/sound/among_walk_1.mp3"),
      Sound.from("assets/sound/among_walk_2.mp3"),
      Sound.from("assets/sound/among_walk_3.mp3")
    ];

    this.renderFunction(this.obstacleContainer, this.visionContainer, this.local_player!.x, this.local_player!.y);
  }

  private onMapEdgeVision(hiddenContainer: Container, visionContainer: Container, x: number, y: number) {

    let leftx_mini = x - this.radius - 100;
    let rightx_mini = x + this.radius + 100;
    let topy_mini = y - this.radius - 100;
    let bottomy_mini = y + this.radius + 100;
    let collision = false;
    let mini_box = [leftx_mini, topy_mini, rightx_mini, bottomy_mini];

    if (WallHelpers.detectMovingBoxCollision(mini_box, this.actual_borders)) {
      this.screenObstacles = []
      let leftx = x - this.SCREEN_WIDTH/2 - 100;
      let rightx = x + this.SCREEN_WIDTH/2 + 100;
      let topy = y - this.SCREEN_HEIGHT/2 - 100;
      let bottomy = y + this.SCREEN_HEIGHT/2 + 100;
      this.actual_borders = [leftx, topy, rightx, bottomy];

      this.map_walls.forEach((wall) => {

        if ((wall[0] >= leftx && wall[0] <= rightx && wall[1] >= topy && wall[1] <= bottomy) || (wall[2] >= leftx && wall[2] <= rightx && wall[3] >= topy && wall[3] <= bottomy)) {
          this.screenObstacles!.push(wall);
        }
        else{
          if (WallHelpers.intersection([leftx, topy, rightx, topy], wall)){
            this.screenObstacles!.push(wall);
          }
          else if (WallHelpers.intersection([rightx, topy, rightx, bottomy], wall)){
            this.screenObstacles!.push(wall);
          }
          else if (WallHelpers.intersection([rightx, bottomy, leftx, bottomy], wall)){
            this.screenObstacles!.push(wall);
          }
          else if (WallHelpers.intersection([leftx, bottomy, leftx, topy], wall)){
            this.screenObstacles!.push(wall);
          }
        }
      });
      this.screenObstacles.push([leftx, topy, rightx, topy]);
      this.screenObstacles.push([rightx, topy, rightx, bottomy]);
      this.screenObstacles.push([rightx, bottomy, leftx, bottomy]);
      this.screenObstacles.push([leftx, bottomy, leftx, topy]);
      // console.log("Obstacle size: ", this.screenObstacles.length, " points amount: ", this.screenObstacles.length * this.screenObstacles[0].length);
      collision = true;
    }

    if (collision) {
      collision = false;
      let offset = 10;

      this.all_segments = [];
      this.screenObstacles!.forEach((segment) => {
        if (true) {
          let a = Math.abs(segment[1] - segment[3]);
          let b = Math.abs(segment[0] - segment[2]);

          if (b !== 0){
            let c = a/b;
            // a^2 + b^2 = 100;
            // a^2 + c^2*a^2 = 100;
            // a^2(1 + c^2) = 100;
            a = Math.sqrt(100/(1 + Math.pow(c,2)));
            b = c*a;
            if( a >= b-3 && a <= b+3){
              a = offset;
              b = offset;
            }
            this.all_segments!.push([segment[0], segment[1], segment[2], segment[3], segment[2] + b, segment[3]+a, segment[0] + b, segment[1]+a]);
          }
          else{
            this.all_segments!.push([segment[0], segment[1], segment[2], segment[3], segment[2] + offset, segment[3], segment[0] + offset, segment[1]]);
          }

        }
        else {
          this.all_segments!.push([segment[0], segment[1], segment[2], segment[3]]);
        }

      });

      this.mLight = new MaskLight(this.all_segments);
    }

    this.mLight.setPosition(x, y);
    this.mLight.createRays();

    let segment2: number[] = [];
    let hiddenSpaces = new Graphics().rect(-this.shiftEdges, -this.shiftEdges, this.SCREEN_WIDTH+2*this.shiftEdges, this.SCREEN_HEIGHT+2*this.shiftEdges).fill({ color: 0xff0000, alpha: 0.5});
    
    for(const point of this.mLight!.outputPolygon){
      segment2.push(point[0] - (x-this.SCREEN_WIDTH/2));
      segment2.push(point[1] - (y-this.SCREEN_HEIGHT/2));
    }
    
    hiddenSpaces.poly(segment2).cut();
    const darkenLayer2 = new Graphics().rect(-this.shiftEdges, -this.shiftEdges, this.SCREEN_WIDTH + 2* this.shiftEdges, this.SCREEN_HEIGHT+ 2*this.shiftEdges).fill({ color: 0x000000, alpha: 0.5});
    darkenLayer2.mask = hiddenSpaces;

    if (visionContainer.children.length > 0) {
      visionContainer.removeChildAt(visionContainer.children.length - 1);
    }
    visionContainer.addChild(darkenLayer2);
  }

  private renderFunction(hiddenContainer: Container, visionContainer: Container, posX: any, posY: any) {
    this.onMapEdgeVision(hiddenContainer, visionContainer, posX, posY);
  }

  private setupVisionLayers(){

    this.hiddenContainer.zIndex = MAP_BOTTOM_Y + 10;
    this.app.stage.addChild(this.hiddenContainer);

    let visionMask = new Graphics().circle(this.app.screen.width / 2, this.app.screen.height / 2, this.radius).fill({ color: 0xff0000, alpha: 0.5 });
    this.visionContainer.mask = visionMask;
    this.visionContainer.zIndex = MAP_BOTTOM_Y + 10;

    this.camera.container.addChild(this.obstacleContainer);
    this.camera.container.addChild(this.visionContainer);

    const darkenLayer = new Graphics().rect(0, 0, this.app.screen.width + 0, this.app.screen.height + 0).fill({ color: 0x000000, alpha: 0.5 });

    this.hiddenContainer.addChild(darkenLayer);

    const maskDarkLayer = new Graphics()
      .rect(-this.shiftEdges, -this.shiftEdges, this.app.screen.width + 2 * this.shiftEdges, this.app.screen.height + 2 * this.shiftEdges)
      .fill({ color: 0xff0000 })
      .circle(this.app.screen.width / 2 + 0, this.app.screen.height / 2 + 0, this.radius)
      .cut();

    const blurDarkLayer = new BlurFilter({
      kernelSize: 9,
      quality: 64,
      strength: 64,
    });
    blurDarkLayer.repeatEdgePixels = false;

    // maskDarkLayer.filters = [blurDarkLayer];

    const bounds = new Rectangle(0, 0, this.app.screen.width, this.app.screen.height);
    const texture = this.app.renderer.generateTexture({
      target: maskDarkLayer,
      resolution: 1,
      frame: bounds,
    });

    const focusDarkLayer = new Sprite(texture);
    darkenLayer.mask = focusDarkLayer;

  }

  private setupContainers() {
    // create
    this.backgroundContentContainer = new Container();
    this.gameContentContainer = this.camera.container; // added to stage in Camera constructor
    this.foregroundContentContainer = new Container();

    this.overlayContainer = new Container();
    this.uiContainer = new Container();

    // set z-index
    this.gameContentContainer.zIndex = (MAP_BOTTOM_Y - MAP_TOP_Y) / 2;
    this.backgroundContentContainer.zIndex = MAP_TOP_Y;
    this.foregroundContentContainer.zIndex = MAP_BOTTOM_Y;

    this.overlayContainer.zIndex = 1000;
    this.uiContainer.zIndex = 2000;

    // setup map
    let mapSprite = Sprite.from("map");
    let mapAboveSprite = Sprite.from("map_above");

    mapSprite.scale.set(1.0);
    mapSprite.anchor.set(0.5);

    mapAboveSprite.scale.set(1.0);
    mapAboveSprite.anchor.set(0.5);

    this.backgroundContentContainer.addChild(mapSprite);
    this.foregroundContentContainer.addChild(mapAboveSprite);

    // drawing lines
    // for (let line of lines) {
    //   let obj: Graphics;
    //   obj = new Graphics()
    //     .poly([new Point(line.begin.x, line.begin.y), new Point(line.end.x, line.end.y), new Point(line.begin.x + 10, line.begin.y + 10), new Point(line.end.x + 10 , line.end.y + 10)])
    //     .fill({ color: "white" });
    
    //   // Add it to the stage to render
    //   this.foregroundContentContainer.addChild(obj);
    // }

    // add to stage
    this.gameContentContainer.addChild(this.backgroundContentContainer);
    this.gameContentContainer.addChild(this.foregroundContentContainer);

    this.app.stage.addChild(this.uiContainer);
    this.app.stage.addChild(this.overlayContainer);
  }

  registerListeners() {
    this.sessionController.playerJoinListener(this.playerJoinListener.bind(this));
    this.sessionController.playerLeftListener(this.playerLeaveListener.bind(this));
    this.sessionController.playerSideChanged(this.playerSideChanged.bind(this));
    this.sessionController.playerMoveListener(this.playerMoveListener.bind(this));

    this.sessionController.init();
  }

  private playerJoinListener(player: any, key: any) {
    let newPlayer = new Player(key, player.color, player.messageDataPlayer.sessionId, player.messageDataPlayer.characterType);

    newPlayer.x = player.position.x;
    newPlayer.y = player.position.y;
    newPlayer.setCachedPosition(newPlayer.position);

    this.players.set(key, newPlayer);
    newPlayer.addToContainer(this.camera.container);

    if (newPlayer.sessionId === this.sessionController.getSessionId()) {
      this.local_player = newPlayer;
      this.camera.follow(newPlayer);
    } else {
      player.listen("position", (value: any, previousValue: number[]) => {
        newPlayer.setCachedPositionX(value.x);
        newPlayer.setCachedPositionY(value.y);
      });

      player.listen("side", (value: any, previousValue: number[]) => {
        newPlayer.setSide(value);
      });

      player.listen("isMoving", (value: any, previousValue: boolean) => {
        newPlayer.setMoving(value);
      });
    }
  }

  private playerLeaveListener(player: any, key: any) {
    let playerInstance = this.players.get(key);

    playerInstance?.removeFromContainer(this.camera.container);
    playerInstance?.destructor();

    this.players.delete(key);
  }

  private playerSideChanged(player: any, key: any){
    let playerInstance = this.players.get(key);

    playerInstance?.setSide(player.side);
  }

  private playerMoveListener(player: any, key: any) {
    let playerInstance = this.players.get(key);

    playerInstance?.setMoving(player.isMoving);
  }

  tick(time: Ticker) {
    let he = Math.floor(time.lastTime / (1000 / 144));
    if (he > this.nLastTime) {
      this.nLastTime = he;

      this.sessionController.sendPosition(this.local_player!.position);
    }

    this.players.forEach((player) => {

      if (player.sessionId !== this.local_player?.sessionId) {
        player.interpolate(0.25);
      }
    });


    // for every Key values change player position
    let mov_vec = new Point(0, 0);

    Object.values(Key).filter(v => typeof v === "number").forEach(keyVal => {
      const key = keyVal as Key;
      if (this.local_player !== null) {
        if (this.controller?.keys[key].pressed) {
          // console.log(this.players);
          switch (key) {
            case Key.UP:
              mov_vec = sum_vectors(mov_vec, UP_VECTOR);
              break;
            case Key.DOWN:
              mov_vec = sum_vectors(mov_vec, DOWN_VECTOR);
              break;
            case Key.LEFT:
              mov_vec = sum_vectors(mov_vec, LEFT_VECTOR);
              break;
            case Key.RIGHT:
              mov_vec = sum_vectors(mov_vec, RIGHT_VECTOR);
              break;
            case Key.Q:
              break;
          }
        }
      }
    });

    mov_vec = normalize_vector(mov_vec);
    mov_vec = multiply_vector(mov_vec, PLAYER_SPEED* time.deltaTime);

    if (this.local_player !== null) {
      let colliding_wall: Wall | null = this.checkCollision(this.local_player, mov_vec);
      if(colliding_wall  === null) {
        
        this.local_player.x += mov_vec.x;
        this.local_player.y += mov_vec.y;
      }
      else {
        let wall: Wall = colliding_wall;
        let wall_vector = new Point(wall.end.x - wall.begin.x, wall.end.y - wall.begin.y);
        let wall_normal = normalize_vector(wall_vector);
        let reflected_vector = multiply_vector(wall_normal, PLAYER_SPEED * time.deltaTime);
        let offset = 10;
        if((wall_vector.x > offset || wall_vector.x < -offset) && (wall_vector.y > offset || wall_vector.y < -offset)){
          if(mov_vec.x * wall_vector.x < 0 || mov_vec.y * wall_vector.y < 0){
            reflected_vector.x = -reflected_vector.x;
            reflected_vector.y = -reflected_vector.y;
          }
          else if(mov_vec.y * wall_vector.y * mov_vec.x * wall_vector.x< 0){
            reflected_vector.x = 0;
            reflected_vector.y = 0;
          }

        }
        else{
          if(wall_vector.x > offset || wall_vector.x < -offset){
            reflected_vector.x = mov_vec.x;
          }
          if(wall_vector.y > offset || wall_vector.y < -offset){
            reflected_vector.y = mov_vec.y;
          }
        }

        let wall2 = this.checkCollision(this.local_player, reflected_vector);
        if(wall2 == null){
          this.local_player.x += reflected_vector.x;
          this.local_player.y += reflected_vector.y;
        }

      }

      this.sessionController.sendPosition(this.local_player.position);

      if (!this.local_player.moving){
        if (length_vector(mov_vec) > 0.01){
          this.local_player.setMoving(true);
          this.sessionController.sendMoving(true);
        }
      } else {
        // player sound every second
        const ss = Math.floor(time.lastTime);

        if (Math.abs(ss - this.sLastTime) > 1200 / 4){
          this.sLastTime = ss;

          let sound = this.walkSounds[Math.floor(Math.random() * this.walkSounds.length)];
          sound.play();
        }

        if (length_vector(mov_vec) < 0.01){
          this.local_player.setMoving(false);
          this.sessionController.sendMoving(false);

          this.sLastTime = 0;
        }
      }

      if(this.local_player.moving){
        this.renderFunction(this.obstacleContainer, this.visionContainer, this.local_player.x, this.local_player.y);
      }
      

      // flip player based on movement direction
      if (mov_vec.x < 0) {
        this.local_player.setSide(-1);
        this.sessionController.sendSide(-1);
      } else if (mov_vec.x > 0) {
        this.local_player.setSide(1);
        this.sessionController.sendSide(1);
      }
    }
  }

  private isColliding(player: Player, move_vector: Point, wall: Wall) {

    const newPosition = new Point(player.x + move_vector.x, player.y + move_vector.y);

    const leftX = newPosition.x - player.widthLeft / 2;
    const rightX = newPosition.x + player.widthRight / 2;

    const upperY = newPosition.y - player.heightTop / 2;
    const lowerY = newPosition.y + player.heightBottom / 2;

    if (upperY > Math.min(wall.begin.y, wall.end.y) && upperY < Math.max(wall.begin.y, wall.end.y)) {
      if (wall.returnCoordinatXhavingY(upperY) >= leftX && wall.returnCoordinatXhavingY(upperY) <= rightX) {
        return true;
      }
    }
    if (lowerY > Math.min(wall.begin.y, wall.end.y) && lowerY < Math.max(wall.begin.y, wall.end.y)) {
      if (wall.returnCoordinatXhavingY(lowerY) >= leftX && wall.returnCoordinatXhavingY(lowerY) <= rightX) {
        return true;
      }
    }
    if (leftX > Math.min(wall.begin.x, wall.end.x) && leftX < Math.max(wall.begin.x, wall.end.x)) {
      if (wall.returnCoordinatYhavingX(leftX) >= upperY && wall.returnCoordinatYhavingX(leftX) <= lowerY) {
        return true;
      }
    }
    if (rightX > Math.min(wall.begin.x, wall.end.x) && rightX < Math.max(wall.begin.x, wall.end.x)) {
      if (wall.returnCoordinatYhavingX(rightX) >= upperY && wall.returnCoordinatYhavingX(rightX) <= lowerY) {
        return true;
      }
    }
    return false;
  }

  private checkCollision(player: Player, move_vector: Point): Wall | null{
    for (let wall of lines) {
      if (this.isColliding(player, move_vector, wall)) {
        return wall;
      }
    }
    return null;
  }
}