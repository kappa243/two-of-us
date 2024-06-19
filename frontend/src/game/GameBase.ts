import { Application, Assets } from "pixi.js";
import { Camera } from "./Camera";
import { GameManager } from "./GameManager";
import { KeyboardController } from "./controls/KeyboardController";
import { Session } from "./online/Session";
import { SessionController } from "./online/SessionController";

export class GameBase {

  private app: Application;
  private session: Session;
  private controller: KeyboardController | null = null;

  private camera!: Camera;
  private sessionController!: SessionController;
  private gameManager!: GameManager;


  /**
   * Preloads assets
   */
  async preload() {
    const assets = [
      { alias: "player", src: "assets/player.png" },
      { alias: "map", src: "assets/map.png"},
      { alias: "map_above", src: "assets/map_above.png"},
      { alias: "walk", src: "assets/walk.png"},
      { alias: "walk_json", src: "assets/walk.json"},
    ];

    await Assets.load(assets);
  }

  constructor(app: Application, session: Session) {
    this.app = app;
    this.session = session;
  }

  async run() {
    await this.preload();

    this.controller = new KeyboardController();
    this.camera = new Camera(this.app);

    this.sessionController = new SessionController(this.session);
    this.gameManager = new GameManager(this.app, this.sessionController, this.controller, this.camera);


    this.app.ticker.add((time) => {
      this.gameManager.tick(time);
    });
  }

  stop() {
    this.controller?.destructor();
    this.controller = null;
  }

}