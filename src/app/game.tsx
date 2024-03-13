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
    await this.app.init({ resizeTo: this._canvas_parent, ...options });

    if (this.app.canvas === undefined)
      throw new Error("Canvas is undefined (renderer init probably failed)");

    // clear old canvas
    this._canvas_parent.textContent = "";
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
    if (this.app.renderer !== undefined)
      this.app.destroy();
  }

  render(): ReactNode {
    return (
      <div
        className="h-dvh w-dvh bg-black"
        ref={(el) => this._canvas_parent = el!}
      /> // this div.node cannot have any child nodes
    );
  }

}