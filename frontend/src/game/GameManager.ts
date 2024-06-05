import { PLAYER_SPEED } from "@/config";
import { Application, Point, Ticker } from "pixi.js";
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


export class GameManager {
  private app: Application;
  private sessionController: SessionController;

  private controller: KeyboardController;
  private camera: Camera;

  private players: Map<string, Player>;
  private local_player: Player | null = null;

  constructor(app: Application, sessionController: SessionController, controller: KeyboardController, camera: Camera) {
    this.app = app;
    this.sessionController = sessionController;

    this.controller = controller;
    this.camera = camera;

    this.players = new Map<string, Player>();

    this.registerListeners();
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
    }

    player.listen("position", (value: any, previousValue: number[]) => {
      newPlayer.setCachedPositionX(value.x);
      newPlayer.setCachedPositionY(value.y);
    });

  }

  private playerLeaveListener(player: any, key: any) {
    let playerInstance = this.players.get(key);

    playerInstance?.removeFromContainer(this.camera.container);
    playerInstance?.destructor();

    this.players.delete(key);
  }


  tick(time: Ticker) {
    this.players.forEach((player) => {
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
              // this.local_player.y -= PLAYER_SPEED * time.deltaTime;
              mov_vec = sum_vectors(mov_vec, UP_VECTOR);
              break;
            case Key.DOWN:
              // this.local_player.y += PLAYER_SPEED * time.deltaTime;
              // this.sessionController.sendPosition(this.local_player.position);
              mov_vec = sum_vectors(mov_vec, DOWN_VECTOR);
              break;
            case Key.LEFT:
              // this.local_player.x -= PLAYER_SPEED * time.deltaTime;
              mov_vec = sum_vectors(mov_vec, LEFT_VECTOR);
              // this.sessionController.sendPosition(this.local_player.position);
              break;
            case Key.RIGHT:
              // this.local_player.x += PLAYER_SPEED * time.deltaTime;
              mov_vec = sum_vectors(mov_vec, RIGHT_VECTOR);
              // this.sessionController.sendPosition(this.local_player.position);
              break;
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
    }

  }

}