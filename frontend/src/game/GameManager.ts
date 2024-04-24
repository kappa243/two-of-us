import { PLAYER_SPEED } from "@/config";
import { Application, Ticker } from "pixi.js";
import { Camera } from "./Camera";
import { Key, KeyboardController } from "./controls/KeyboardController";
import { Player } from "./objects/Player";
import { SessionController } from "./online/SessionController";


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

    // this.registerListeners();
  }


  registerListeners() {
    this.sessionController.playerJoinListener(this.playerJoinListener);
  }

  private playerJoinListener(player: any, key: any) {
    let newPlayer = new Player(key, player.messageDataPlayer.sessionId, player.messageDataPlayer.characterType);

    newPlayer.x = player.position.x;
    newPlayer.y = player.position.y;
    newPlayer.setCachedPosition(newPlayer.position);

    this.players.set(key, newPlayer);
    newPlayer.addToContainer(this.camera.container);

    console.log("Player joined: ", newPlayer);

    if (newPlayer.sessionId === this.sessionController.getSessionId()) {
      this.local_player = newPlayer;
    }

    player.listen("position", (value: any, previousValue: number[]) => {
      newPlayer.setCachedPositionX(value.x);
      newPlayer.setCachedPositionY(value.y);
    });
  }


  private readonly keyVals = Object.values(Key).filter(v => typeof v === "number");

  tick(time: Ticker) {
    this.players.forEach((player) => {
      if (player.sessionId !== this.local_player?.sessionId) {
        player.interpolate(0.25);
      }
    });

    // for every Key values change player position
    if (this.local_player !== null) {
      for (let keyVal in this.keyVals) {
        const key = keyVal as unknown as Key;

        if (this.controller?.keys[key].pressed) {
          switch (key) {
            case Key.UP:
              this.local_player.y -= PLAYER_SPEED * time.deltaTime;
              this.sessionController.sendPosition(this.local_player.position);
              break;
            case Key.DOWN:
              this.local_player.y += PLAYER_SPEED * time.deltaTime;
              this.sessionController.sendPosition(this.local_player.position);
              break;
            case Key.LEFT:
              this.local_player.x -= PLAYER_SPEED * time.deltaTime;
              this.sessionController.sendPosition(this.local_player.position);
              break;
            case Key.RIGHT:
              this.local_player.x += PLAYER_SPEED * time.deltaTime;
              this.sessionController.sendPosition(this.local_player.position);
              break;
            case Key.Q:
              break;
          }
        }
      }
    }

  }

}