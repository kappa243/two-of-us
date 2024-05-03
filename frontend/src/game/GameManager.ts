import { PLAYER_SPEED } from "@/config";
import { Application, Container, Sprite, Ticker } from "pixi.js";
import { Camera } from "./Camera";
import { Key, KeyboardController } from "./controls/KeyboardController";
import { Player } from "./objects/Player";
import { SessionController } from "./online/SessionController";


export class GameManager {
  private app: Application;
  private sessionController: SessionController;

  private controller: KeyboardController;
  private camera: Camera;

  // layers
  private backgroundContentContainer: Container;
  private gameContentContainer: Container;
  private foregroundContentContainer: Container;

  private uiContainer: Container;
  private overlayContainer: Container;

  private players: Map<string, Player>;
  private local_player: Player | null = null;

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
    this.gameContentContainer.zIndex = 0;
    this.backgroundContentContainer.zIndex = 0;
    this.foregroundContentContainer.zIndex = 100;

    this.overlayContainer.zIndex = 1000;
    this.uiContainer.zIndex = 2000;

    // setup map
    let mapSprite = Sprite.from("map");
    mapSprite.scale.set(0.7);
    mapSprite.anchor.set(0.5);
    this.backgroundContentContainer.addChild(mapSprite);    

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

    Object.values(Key).filter(v => typeof v === "number").forEach(keyVal => {
      const key = keyVal as Key;
      if (this.local_player !== null) {
        if (this.controller?.keys[key].pressed) {
          console.log(this.players);
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
    });

  }

}