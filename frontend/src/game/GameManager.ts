import { MAP_BOTTOM_Y, MAP_TOP_Y, PLAYER_SPEED } from "@/config";
import { Application, Container, Point, Sprite, Ticker } from "pixi.js";
import { Camera } from "./Camera";
import { Key, KeyboardController } from "./controls/KeyboardController";
import { Player } from "./objects/Player";
import { SessionController } from "./online/SessionController";

// TODO move to movement class

const UP_VECTOR = new Point(0, -1);
const DOWN_VECTOR = new Point(0, 1);
const LEFT_VECTOR = new Point(-1, 0);
const RIGHT_VECTOR = new Point(1, 0);

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

  private uiContainer!: Container;
  private overlayContainer!: Container;

  private players: Map<string, Player>;
  private local_player: Player | null = null;

  private nLastTime: number = 0;

  constructor(app: Application, sessionController: SessionController, controller: KeyboardController, camera: Camera) {
    this.app = app;
    this.sessionController = sessionController;

    this.controller = controller;
    this.camera = camera;

    this.setupContainers();

    this.players = new Map<string, Player>();

    this.registerListeners();
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
    }
    else {
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
      if (player.moving)
        console.log(player.sessionId, player.moving);

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
            case Key.Q:
              break;
          }
        }
      }
    });

    mov_vec = normalize_vector(mov_vec);
    mov_vec = multiply_vector(mov_vec, PLAYER_SPEED * time.deltaTime);

    if (this.local_player !== null) {
      this.local_player.x += mov_vec.x;
      this.local_player.y += mov_vec.y;

      this.sessionController.sendPosition(this.local_player.position);

      if (!this.local_player.moving){
        if (length_vector(mov_vec) > 0.01){
          this.local_player.setMoving(true);
          this.sessionController.sendMoving(true);
        }
      } else {
        if (length_vector(mov_vec) < 0.01){
          this.local_player.setMoving(false);
          this.sessionController.sendMoving(false);
        }
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

}