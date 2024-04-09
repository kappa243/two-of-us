import { Application, Assets } from "pixi.js";
import { Camera } from "./Camera";
import { Controller, Key } from "./Controller";
import { Room } from "colyseus.js";
import { Player } from "../game/Player";
import { PLAYER_SPEED } from "./config";
import { FollowableCharacter } from "./FollowableCharacter";

export enum InputType {
  UP = 0,
  DOWN,
  RIGHT,
  LEFT
};

export class GameBase {

  private app: Application;
  private controller: Controller | null = null;

  private camera!: Camera;
  private room: Room | null = null;

  private _lock: boolean = false;
  // private ala = 0;

  private players: Map<string,Player> = new Map();
  // private firstBunny?: FollowableBunny;
  // private secondBunny?: FollowableChicken;

  // private secondBunnyData: number[] = [0,0];

  /**
   * Preloads assets
   */
  async preload() {
    const assets = [
      { alias: "bunny", src: "https://pixijs.com/assets/bunny.png" },
      { alias: "eggHead", src: "https://pixijs.com/assets/eggHead.png" },
      { alias: 'flowerTop', src: 'https://pixijs.com/assets/flowerTop.png' }
    ];

    await Assets.load(assets);
  }

  constructor(app: Application) {
    this.app = app;
    this.controller = new Controller();
    this.camera = new Camera(this.app);
  }

  addPlayer(player: Player){
    this.players.set(player.getSessionId(), player);
    // console.log("amount of players: ", this.players.size);
    this.players.get(player.getSessionId())?.setFollowable(this.camera);
    if(this.room!.sessionId === player.getSessionId()){
      this.camera.follow(player.followable!);
    }
    // this.players.forEach( (player) => {
    //       player.setFollowable(this.camera);
    // });
  }

  // setSecondBunnyPosition(position: [number]){
  //   this.secondBunnyData[0] = position.at(0)!;
  //   this.secondBunnyData[1] = position.at(1)!;
  // }

  // setSecondBunnyX(x: number){
  //   this.secondBunnyData[0] = x;
  // }

  // setSecondBunnyY(y: number){
  //   this.secondBunnyData[1] = y;
  // }

  setRoom(room: Room){
    // if(this.room !== null){
      // console.log("room not null");
    // }
    this.room = room;
    // console.log("room sessionId: ", this.room.sessionId);
  }


  async run(a: any) {
    // await this.preload();
    // console.log(a);

    // this.players.forEach( (player) => {
    //   // console.log("player: ", player);
    //   // if( player.getSessionId() === this.room?.sessionId)
    //       player.setFollowable(this.camera);
    // });

    // this.firstBunny = new FollowableBunny(this.app.screen.width / 2, this.app.screen.height / 2);
    // this.secondBunny = new FollowableChicken(25, 25);
    // this.firstBunny?.addToContainer(this.camera.container);
    // this.secondBunny.addToContainer(this.camera.container);
    
    // this.firstBunny!.position.x = this.app.screen.width / 2;
    // this.firstBunny!.position.y = this.app.screen.height / 2;
    
    // this.camera.setPosition(0, 0);
    // this.camera.follow(this.firstBunny!);

    this.app.ticker.add((time) => {

      // const bunny = this.camera.followedObject as FollowableBunny;

      // bunny.rotation += 0.1 * time.deltaTime;
      this.players.forEach( (player) => {
        // console.log("player: ", player.getSessionId(), " ", player.getPositionX());
        if(player.getSessionId() !== this.room!.sessionId){
          player.interpolate(0.25);
          player.followable!.x = player.getPositionX();
          player.followable!.y = player.getPositionY();
        }
      });

      let local_player = this.camera.followedObject as FollowableCharacter; //this.players.get(this.room!.sessionId);
      // let local_player_pos = local_player?.getPosition();

      // this.secondBunny!.x = this.interpolation(this.secondBunny!.x, this.secondBunnyData[0], 0.25);
      // this.secondBunny!.y = this.interpolation(this.secondBunny!.y, this.secondBunnyData[1], 0.25);

      // for every Key values change bunny position
      Object.values(Key).filter(v => typeof v === "number").forEach( keyVal => {
        const key = keyVal as Key;

        if (this.controller?.keys[key].pressed) {
          switch (key) {
            case Key.UP:
              // console.log("UP and sessionId: ", this.room!.sessionId);
              // this.room?.send("movementInput", InputType.UP);
              // local_player_pos![1] -= PLAYER_SPEED * time.deltaTime;
              // local_player?.setPosition(local_player_pos!);
              local_player.y-= PLAYER_SPEED * time.deltaTime;
              this.room?.send("movementInput", {"x": local_player.x, "y": local_player.y});
              // this.players.get(this.room!.sessionId)!.setPosition(local_player_pos!);
              break;
            case Key.DOWN:
              // this.room?.send("movementInput", InputType.DOWN);
              // local_player_pos![1] += PLAYER_SPEED * time.deltaTime;
              // local_player?.setPosition(local_player_pos!);
              local_player.y += PLAYER_SPEED * time.deltaTime;
              this.room?.send("movementInput", {"x": local_player.x, "y": local_player.y});
              break;
            case Key.LEFT:
              // this.room?.send("movementInput", InputType.LEFT);
              // local_player_pos![0] -= PLAYER_SPEED * time.deltaTime;
              // local_player?.setPosition(local_player_pos!);
              local_player.x -= PLAYER_SPEED * time.deltaTime;
              this.room?.send("movementInput", {"x": local_player.x, "y": local_player.y});
              break;
            case Key.RIGHT:
              // this.room?.send("movementInput", InputType.RIGHT);
              // local_player_pos![0] += PLAYER_SPEED * time.deltaTime;
              // local_player?.setPosition(local_player_pos!);
              local_player.x += PLAYER_SPEED * time.deltaTime;
              this.room?.send("movementInput", {"x": local_player.x, "y": local_player.y});
              break;
            case Key.Q:
              // this.room?.send("players", {});
              // console.log("players: ", this.players);
              // this.players.forEach( (player) => {
                // console.log("player: ", player.getSessionId(), " ", player.getPositionX(), ",", player.getPositionY());
              // });
              break
          }
        }

        if (this.controller?.keys[key].pressed === false && this._lock) {
          this._lock = false;
        }

      });

    });
  }

  stop(){
    this.controller?.destructor();
    this.controller = null;
  }

}