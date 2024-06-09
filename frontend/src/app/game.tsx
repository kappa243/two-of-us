"use client";

import { GAME_WORLD_ROOM_NAME } from "@/config";
import { GameBase } from "@/game/GameBase";
import { Session } from "@/game/online/Session";
import { Application, ApplicationOptions, Renderer } from "pixi.js";
import { useEffect, useRef } from "react";

const options: Partial<ApplicationOptions> = {
  background: "#000000"
};

const Game = () => {
  const canvasParentRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application<Renderer> | null>(null);
  const gameRef = useRef<GameBase | null>(null);
  const sessionRef = useRef<Session | null>(null);

  useEffect(() => {
    const canvasParent = canvasParentRef.current;
    
    const app = new Application();
    const session = new Session();
    const game = new GameBase(app, session);
    appRef.current = app;
    gameRef.current = game;
    sessionRef.current = session;
    
    session.createClient();

    const runtime = (async () => {
      if (!canvasParentRef.current) {
        throw new Error("Canvas parent is undefined");
      }

      await app?.init({ resizeTo: canvasParentRef.current, ...options });

      if (app?.renderer.canvas === undefined) {
        throw new Error("Canvas is undefined (renderer init probably failed)");
      }

      canvasParentRef.current.appendChild(app.canvas);

      try {
        await session.joinRoom(GAME_WORLD_ROOM_NAME);
      }
      catch(error){
        console.log("Cannot connect to the room! Try reconnect..");
      }

      await game?.run();
            
    })();

    return () => {
      runtime.then(() => {
        canvasParent?.removeChild(app.canvas);
        game?.stop();
        app?.stop();
        session?.leaveRoom();
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