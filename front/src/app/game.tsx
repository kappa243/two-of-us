"use client";

import { GameBase } from "@/game/GameBase";
import { Application, ApplicationOptions, Renderer } from "pixi.js";
import { useEffect, useRef } from "react";
import * as Colyseus from "colyseus.js";
import { Room1 } from "";

const options: Partial<ApplicationOptions> = {
  background: "#1099bb"
};

const Game = () => {
  const canvasParentRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application<Renderer> | null>(null);
  const gameRef = useRef<GameBase | null>(null);

  useEffect(() => {
    const canvasParent = canvasParentRef.current;
    
    const app = new Application();
    const game = new GameBase(app);
    appRef.current = app;
    gameRef.current = game;

    let client2 = new Colyseus.Client('ws://localhost:2567');
    
    const runtime = (async () => {
      if (!canvasParentRef.current) {
        throw new Error("Canvas parent is undefined");
      }
      
      await app?.init({ resizeTo: canvasParentRef.current, ...options });
      
      if (app?.renderer.canvas === undefined) {
        throw new Error("Canvas is undefined (renderer init probably failed)");
      }
      
      canvasParentRef.current.appendChild(app.canvas);

      await game?.run(app);

      let my_room2 = await client2.joinOrCreate("my_room");
      console.log("my_room2: ", my_room2.id);
    
      my_room2.onMessage("message_type2", (message: any) => {
        console.log("message_type22!!!!", message);
      });

      my_room2.onMessage("location3001", (message: any) => {
        console.log("location3001: ", message);
        gameRef.current?.setSecondBunnyPosition(message.x, message.y);
      });
      console.log("sending message...");
      // my_room2.send("location", { x: 1, y: 2});
      my_room2.send("location2", {type: 'message', test: 'Hello'});

      // my_room2.state.players.onAdd((player, sessionId) => {
      //   console.log("a player has joined!");
      // });
            
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