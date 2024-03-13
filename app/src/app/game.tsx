"use client";

import { GameBase } from "@/game/GameBase";
import { Application, ApplicationOptions, Renderer } from "pixi.js";
import { Component, ReactNode } from "react";


const options: Partial<ApplicationOptions> = {
  background: "#1099bb"
};

export default class Game extends Component {

  // React only - don't touch
  _canvas_parent!: HTMLDivElement;
  app!: Application<Renderer>;
  game!: GameBase;

  /** 
   * Intializes renderer and attaches it's canvas to the DOM
  */
  async init() {
    this._canvas_parent = document.getElementById("game") as HTMLDivElement;

    await this.app.init({ resizeTo: this._canvas_parent, ...options });

    if (this.app.renderer.canvas === undefined)
      throw new Error("Canvas is undefined (renderer init probably failed)");

    this._canvas_parent.appendChild(this.app.canvas);
  }

  componentDidMount() {
    this.app = new Application();
    this.game = new GameBase();

    (async () => {
      await this.init();
      await this.game.run(this.app);
    })();

  }

  componentWillUnmount() {
    this._canvas_parent.textContent = "";

    if (this.game !== undefined)
      this.game.stop();

    if (this.app.renderer !== undefined)
      this.app.destroy();
  }

  render(): ReactNode {
    return (
      <div
        className="h-dvh w-dvh bg-black"
        id="game"
      /> // this div.node cannot have any child nodes
    );
  }

}