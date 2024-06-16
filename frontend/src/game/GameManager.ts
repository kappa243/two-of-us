import { MAP_BOTTOM_Y, MAP_TOP_Y, PLAYER_SPEED } from "@/config";
import { Application, Container, Point, Sprite, Ticker } from "pixi.js";
import { Camera } from "./Camera";
import { Key, KeyboardController } from "./controls/KeyboardController";
import { Player } from "./objects/Player";
import { SessionController } from "./online/SessionController";
import {Wall} from "@/game/utils/Wall";
import {WallProvider} from "@/game/utils/WallProvider";
import { Graphics } from "pixi.js";
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

    // drawing lines
    // for (let line of lines) {
    //   let obj: Graphics;
    //   obj = new Graphics()
    //     .poly([new Point(line.begin.x, line.begin.y), new Point(line.end.x, line.end.y), new Point(line.begin.x + 10, line.begin.y + 10), new Point(line.end.x + 10 , line.end.y + 10)])
    //     .fill({ color: "white" });
    //
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

    this.sessionController.init();
  }

  private playerJoinListener(player: any, key: any) {
    let newPlayer = new Player(key, player.messageDataPlayer.sessionId, player.messageDataPlayer.characterType);

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
    }
  }

  private playerLeaveListener(player: any, key: any) {
    let playerInstance = this.players.get(key);

    playerInstance?.removeFromContainer(this.camera.container);
    playerInstance?.destructor();

    this.players.delete(key);
  }


  tick(time: Ticker) {
    let he = Math.floor(time.lastTime / (1000 / 60));
    if (he > this.nLastTime) {
      this.nLastTime = he;
      // console.log("Time: ", he);

      this.sessionController.sendPosition(this.local_player!.position);
    }

    this.players.forEach((player) => {
      // console.log(player.sessionId);
      console.log(this.local_player?.position);
      // console.log(player.sessionId !== this.local_player?.sessionId);
      if (player.sessionId !== this.local_player?.sessionId) {
        player.interpolate(0.25);
        // console.log(player.position);
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
    mov_vec = multiply_vector(mov_vec, PLAYER_SPEED * time.deltaTime);

    if (this.local_player !== null && !this.checkCollision(this.local_player, mov_vec)) {
      this.local_player.x += mov_vec.x;
      this.local_player.y += mov_vec.y;
      this.sessionController.sendPosition(this.local_player.position);
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

  private checkCollision(player: Player, move_vector: Point) {
    for (let wall of lines) {
      if (this.isColliding(player, move_vector, wall)) {
        return true;
      }
    }
    return false;
  }
}