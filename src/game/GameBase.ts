import { Application, Assets, Sprite } from "pixi.js";
import { Controller, Key } from "./Controller";

export class GameBase {

  private controller!: Controller;

  /**
   * Preloads assets
   */
  private async preload() {
    const assets = [
      { alias: "bunny", src: "https://pixijs.com/assets/bunny.png" }
    ];

    await Assets.load(assets);
  }

  async run(app: Application) {
    await this.preload();

    this.controller = new Controller();

    const bunny = Sprite.from("bunny");
    app.stage.addChild(bunny);

    bunny.anchor.set(0.5);
    bunny.x = app.screen.width / 2;
    bunny.y = app.screen.height / 2;

    app.ticker.add((time) => {
      // bunny.rotation += 0.1 * time.deltaTime;

      // for every Key values change bunny position
      Object.values(Key).filter(v => typeof v === "number").forEach( keyVal => {
        const key = keyVal as Key;

        if (this.controller.keys[key].pressed) {
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
          }
        }
      });


    });
  }
}