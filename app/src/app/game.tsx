"use client";

import { GameBase } from "@/game/GameBase";
import { Application, ApplicationOptions, Renderer } from "pixi.js";
import { useEffect, useRef } from "react";

const options: Partial<ApplicationOptions> = {
  background: "#1099bb"
};

const Game = () => {
  const canvasParentRef = useRef<HTMLDivElement>(null);
  const app = useRef<Application<Renderer> | null>(null);
  const game = useRef<GameBase | null>(null);

  useEffect(() => {
    const canvasParentRefCopy = canvasParentRef.current;
    (async () => {
      app.current = new Application();
      game.current = new GameBase();

      if (!canvasParentRef.current) {
        throw new Error("Canvas parent ref is null");
      }
  
      await app.current?.init({ resizeTo: canvasParentRef.current, ...options });
  
      if (app.current?.renderer.canvas === undefined) {
        throw new Error("Canvas is undefined (renderer init probably failed)");
      }
  
      canvasParentRef.current.appendChild(app.current.canvas);
      await game.current?.run(app.current);
      
    })();

    return () => {
      if (canvasParentRefCopy) canvasParentRefCopy.textContent = "";

      if (game.current) game.current.stop();
      if (app.current?.renderer) app.current.stop();
    };
  }, []);

  return (
    <div
      ref={canvasParentRef}
      className="h-dvh w-dvh bg-black"
    />
  );
};

export default Game;