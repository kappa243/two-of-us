"use client";

import { GameBase } from "@/game/GameBase";
import { Application, ApplicationOptions, Renderer } from "pixi.js";
import { useEffect, useRef } from "react";
import { GameWorldRoom } from "@/game/rooms/GameWorldRoom";
import { GAME_WORLD_ROOM_NAME } from "@/game/config";

const options: Partial<ApplicationOptions> = {
  background: "#1099bb"
};

const Game = () => {
  const canvasParentRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application<Renderer> | null>(null);
  const gameRef = useRef<GameBase | null>(null);
  const gameWorldRoom = useRef<GameWorldRoom | null>(null);

  useEffect(() => {
    const canvasParent = canvasParentRef.current;
    
    const app = new Application();
    const game = new GameBase(app);
    const gameWorldRm = new GameWorldRoom();
    appRef.current = app;
    gameRef.current = game;
    gameWorldRoom.current = gameWorldRm;
    
    gameWorldRm.createClient(game);

    const runtime = (async () => {
      if (!canvasParentRef.current) {
        throw new Error("Canvas parent is undefined");
      }

      await app?.init({ resizeTo: canvasParentRef.current, ...options });

      if (app?.renderer.canvas === undefined) {
        throw new Error("Canvas is undefined (renderer init probably failed)");
      }

      canvasParentRef.current.appendChild(app.canvas);

      await game.preload();

      try {
        game.setRoom(await gameWorldRm.joinRoom(GAME_WORLD_ROOM_NAME));
      }
      catch(error){
        console.log("Cannot connect to the room! Try reconnect..");
      }

      await game?.run(app);
            
    })();

    return () => {
      runtime.then(() => {
        canvasParent?.removeChild(app.canvas);
        game?.stop();
        app?.stop();
      });
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