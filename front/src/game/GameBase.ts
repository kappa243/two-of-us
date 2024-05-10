import { Application, Assets, BlurFilter, Container, Graphics, Rectangle, Sprite } from "pixi.js";
import { Camera } from "./Camera";
import { Controller, Key } from "./Controller";
import { FollowableBunny } from "./FollowableBunny";
import { get, map } from "lodash";
import { runInThisContext } from "vm";

const SCREEN_WIDTH = 1700;
const SCREEN_HEIGHT = 900;
// JSON.stringify()
// JSON.parse()
class MaskLight {
  private position = [0,0];
  private obstacles: any[] = [];
  private borders: any[] =[[[SCREEN_WIDTH, 0], [0, 0]], [[SCREEN_WIDTH, SCREEN_HEIGHT], [SCREEN_WIDTH, 0]], [[0, SCREEN_HEIGHT], [SCREEN_WIDTH, SCREEN_HEIGHT]], [[0, 0], [0, SCREEN_HEIGHT]]]; 
  // private borders: any[] =[[[0, SCREEN_WIDTH], [0, 0]], [[SCREEN_HEIGHT, SCREEN_WIDTH], [0, SCREEN_WIDTH]], [[SCREEN_HEIGHT, 0], [SCREEN_HEIGHT, SCREEN_WIDTH]], [[0, 0], [SCREEN_HEIGHT, 0]]]; 
  private walls: any[] = [];
  private wallsCenter: { [id: number] : number[]; } = {};
  private points: Set<string> = new Set();
  private points_begin: { [id: string] : any[]; } = {};
  private points_end: { [id: string] : any[]; } = {};
  outputPolygon: number[][] = [];

  checkBorder(wall: any){
    let result = false;
    this.borders.forEach( (border) => {
      if(result) return;
      if (wall[0] === border[0] && wall[1] === border[1]){
        result = true;
      }
    });
    return result;
  }

  checkBorderPoint(point: number[]){
    let result = false;
    this.borders.forEach( (border) => {
      if(result) return;
      if (point === border[0] || point === border[1]){
        result = true;
      }
    });
    return result;
  }

  getIdFromPoint(point: number[]){
    return String(point[0]) + "," + String(point[1]);
  }

  constructor(obstacles: any[]) {

    this.borders.forEach( (border) => {
      this.walls.push(border);
    });

    this.walls.forEach( (wall, idx) => {
      let halfLength = this.vectorLength(wall[0], wall[1]) / 2;
      // console.log("wall: ", wall[0], wall[1]);
      // console.log("halfLength: ");
      // console.log(halfLength);
      let direction = this.angleBetweenVectors(wall[0], wall[1]);
      // console.log("direction: ");
      // console.log(direction);
      let center = this.moveUsingAngle(wall[0], -direction, halfLength);
      // console.log("center: ");
      // console.log(center);
      this.wallsCenter[idx] = center;
    });

    obstacles.forEach( (obstacle) => {
      this.addObsctacle(obstacle);
    });

    this.setPoints(); 
    // console.log("walls: ");
    // console.log(this.walls);
    // console.log("wallsCenter: ");
    // console.log(this.wallsCenter);
    // console.log("points: ");
    // console.log(this.points);
    // console.log("rays: ");
    // console.log(this.createRays());

  }

  vectorLength(startPoint: any, endPoint: any){
    return Math.sqrt(Math.pow(endPoint[0] - startPoint[0], 2) + Math.pow(endPoint[1] - startPoint[1], 2));
  }

  angleBetweenVectors(startPoint: any, endPoint: any){
    let result = -Math.atan2(endPoint[0] - startPoint[0], endPoint[1] - startPoint[1]);
    // console.log("radians: ", result);
    return result;
  }

  calculate_vector_2d(angle: number, scalar: number){
    let change_y = Math.cos(angle)
    let change_x = Math.sin(angle)
    return [change_x * scalar, change_y * scalar]
  }
  
  moveTowardsPoint(startPoint: any, endPoint: any, velocity: number){
    const angle = this.angleBetweenVectors(startPoint, endPoint)
    const v = this.calculate_vector_2d(angle, velocity)

    return [startPoint[0] + v[0], startPoint[1] + v[1]]
  }

  moveUsingAngle(startPoint: any, angle: number, velocity: number){
    const v = this.calculate_vector_2d(angle, velocity)
    return [startPoint[0] + v[0], startPoint[1] + v[1]]
  }

  checkOrientation(point1: number[], point2: number[], point3: number[]){
    return ((point2[1] - point1[1]) * (point3[0] - point2[0]) - (point2[0] - point1[0]) * (point3[1] - point2[1])) > 0;
  }

  onSegment(p1: number[], p2: number[], q: number[]){
    return (q[0] <= Math.max(p1[0], p2[0]) && q[0] >= Math.min(p1[0], p2[0]) && q[1] <= Math.max(p1[1], p2[1]) && q[1] >= Math.min(p1[1], p2[1]))
  }

  intersecttion(wall1: any, wall2: any){
    let o1 = this.checkOrientation(wall1[0], wall1[1], wall2[0]);
    let o2 = this.checkOrientation(wall1[0], wall1[1], wall2[1]);
    let o3 = this.checkOrientation(wall2[0], wall2[1], wall1[0]);
    let o4 = this.checkOrientation(wall2[0], wall2[1], wall1[1]);

    if (o1 != o2 && o3 != o4){
      return true;
    }

    if (o1 == false && this.onSegment(wall1[0], wall1[1], wall2[0])){
      return true;
    }
    if(o2 == false && this.onSegment(wall1[0], wall1[1], wall2[1])){
      return true;
    }
    if(o3 == false && this.onSegment(wall2[0], wall2[1], wall1[0])){
      return true;
    }
    if(o4 == false && this.onSegment(wall2[0], wall2[1], wall1[1])){
      return true;
    }
    return false;
  }

  pointOfIntersection(wall1: any, wall2: any){
    let x1 = wall1[0][0];
    let y1 = wall1[0][1];
    let x2 = wall1[1][0];
    let y2 = wall1[1][1];
    let x3 = wall2[0][0];
    let y3 = wall2[0][1];
    let x4 = wall2[1][0];
    let y4 = wall2[1][1];

    let a1 = y2 - y1;
    let b1 = x1 - x2;
    let c1 = a1*x1 + b1*y1;
    let a2 = y4 - y3;
    let b2 = x3 - x4;
    let c2 = a2*x3 + b2*y3;

    let det = a1*b2 - a2*b1;
    let x = (b2*c1 - b1*c2) / det;
    let y = (a1*c2 - a2*c1) / det;

    return [x, y];
  }

  degrees(rad: number){
    let result = (rad * 180 / Math.PI) % 360;
    if(result < 0){
      result = 360 + result;
    }
    return result;
  }

  addObsctacle(obstacle: any) {
    this.obstacles.push(obstacle);
    for(let i = 0; i<obstacle.length-2; i+=2){
      let wall = [[obstacle[i], obstacle[i+1]], [obstacle[i+2], obstacle[i+3]]];
      this.walls.push(wall);
      let halfLength = this.vectorLength(wall[0], wall[1]) / 2
      let direction = this.angleBetweenVectors(wall[0], wall[1])
      let center = this.moveUsingAngle(wall[0], -direction, halfLength)
      this.wallsCenter[Object.keys(this.wallsCenter).length] = center
      // console.log("center2: ", Object.keys(this.wallsCenter).length ," ", center)
      if (i === obstacle.length-4 && i !== 0){
        let wall = [[obstacle[i+2], obstacle[i+3]], [obstacle[0], obstacle[1]]];
        this.walls.push(wall);
        let halfLength = this.vectorLength(wall[0], wall[1]) / 2
        let direction = this.angleBetweenVectors(wall[0], wall[1])
        let center = this.moveUsingAngle(wall[0], -direction, halfLength)
        this.wallsCenter[Object.keys(this.wallsCenter).length] = center
      }
    }
  }

  setPosition(x: number, y: number) {
    this.position = [x, y];
  }

  toRadians(degrees: number){
    return degrees * Math.PI / 180;
  }

  setPoints(){
    this.walls.forEach( (wall, idx) => {
      if(!this.points.has(JSON.stringify(wall[0]))){
        this.points.add(JSON.stringify(wall[0]));
      }
      this.points_begin[JSON.stringify(wall[0])] = wall;
      if(!this.points.has(JSON.stringify(wall[1]))){
        this.points.add(JSON.stringify(wall[1]));
      }
      this.points_end[JSON.stringify(wall[1])] = wall;
    });
  }

  createRays(){
    let points = Array.from(this.points);
    // console.log("sorting points");
    points.sort((a, b) => {
      a = JSON.parse(a);
      b = JSON.parse(b);
      // console.log("vectors: ", this.position, a);
      // console.log("angleBetweenVectors: ", this.degrees(this.angleBetweenVectors(this.position, a)));
      if (this.degrees(this.angleBetweenVectors(this.position, a)) < this.degrees(this.angleBetweenVectors(this.position, b))){
        return -1;
      } else {
        return 1;
      }
    });
    
    // console.log("Sorted points: ", points, " ", points.length);

    let walls = Array.from(this.walls);
    // console.log(walls.length," ", this.wallsCenter.);
    for(let i = 0; i < walls.length; i++){
      walls[i].push(this.wallsCenter[i]);
      // console.log("walls[i]: ", walls[i]);
    }

    // console.log("sorting walls", walls);
    walls.sort((a, b) => {
      // console.log("a: ", a);
      if (this.vectorLength(this.position, a[2]) < this.vectorLength(this.position, b[2])){
        return -1;
      } else {
        return 1;
      }
    });

    // console.log("Sorted walls: ", walls, " ", walls.length);

    let rays = this.prepareRays();
    // console.log("Rays: ", rays, " ", rays.length);
    let otherRays: number[][][] = [];
    let collision: Set<number[][]> = new Set();
    // console.log("walls: ", this.walls)
    walls.forEach( (wall) => {
      let filteredRays = rays.filter( (ray) => {
        return this.checkOrientation(this.position, wall[1], ray[1]) &&
          !this.checkOrientation(this.position, wall[0], ray[1]);
      });
      console.log("wall: ", wall);
      console.log("fitered_rays: ", filteredRays, " ", filteredRays.length);
      for(let idx = 0; idx < filteredRays.length; idx++){
        let ray = filteredRays[idx];
        if( collision.has(ray) ){
          continue;
        }

        if(this.intersecttion(wall, ray)){
          let endRay = ray[1];
          if(this.points.has(JSON.stringify(endRay))){
            let wall1 = this.points_begin[JSON.stringify(endRay)];
            let wall2 = this.points_end[JSON.stringify(endRay)];
            if (wall !== wall1 && wall !== wall2){
              collision.add(ray);
            }
          }
          else {
            collision.add(ray);
            endRay = this.pointOfIntersection(ray, wall);
            otherRays.push([this.position, endRay]);
          }
        }

      }

    });

    let filteredRays: number[][][] = []
    rays.forEach( (ray) => {
      if (!collision.has(ray)){
        filteredRays.push(ray);
      }
    });
    filteredRays = filteredRays.concat(otherRays);
    
    filteredRays.sort((a, b) => {
      if(this.angleBetweenVectors(this.position, a[1]) < this.angleBetweenVectors(this.position, b[1])){
        return -1;
      } else {
        return 1;
      }
    });

    filteredRays.forEach( (ray) => {
      this.outputPolygon.push(ray[1]);
    });
    
  }

  prepareRays(){
    let rays: number[][][] = []
    let rightmost_angle = 0;
    let leftmost_angle = 0;
    let veiled: Set<string> = new Set();

    this.points.forEach( (point1) => {
      let point = JSON.parse(point1);
      let angle = this.angleBetweenVectors(this.position, point);
      // console.log("point: ", point)
      // console.log("angle: ", angle)
      if (veiled.has(JSON.stringify(point))) return;
      if (this.checkBorderPoint(point)) { 
        rays.push([this.position, point]);
        return; 
      }

      let wall = this.points_begin[JSON.stringify(point)];
      if (this.checkOrientation(this.position, point, wall[1])) {
        // console.log("angle in end_b: ", angle);
        let passAngle = -this.toRadians(this.degrees(angle)+0.05);
        let end = this.moveUsingAngle(this.position, passAngle, 1500);
        // console.log("end_b: ", end);
        rays.push([this.position, end]);
        rightmost_angle = angle
      }
      else {
        rightmost_angle = this.angleBetweenVectors(this.position, wall[1]);
      }

      rays.push([this.position, point]);

      wall = this.points_end[JSON.stringify(point)];
      if (!this.checkOrientation(this.position , point, wall[0])){
        // console.log("angle in end_a: ", angle);
        let passAngle = -this.toRadians(this.degrees(angle)-0.05);
        let end = this.moveUsingAngle(this.position, passAngle, 1500);
        // console.log("end_a: ", end);
        rays.push([this.position, end]);
        leftmost_angle = angle
      }
      else {
        leftmost_angle = this.angleBetweenVectors(this.position, wall[0]);
      }

      this.points.forEach( (point22) => {
        let point2 = JSON.parse(point22);
        if(this.vectorLength(this.position, point2) > this.vectorLength(this.position, point)){
          let angle2 = this.angleBetweenVectors(this.position, point2);

          if (leftmost_angle > rightmost_angle){
            if (leftmost_angle < angle2 && angle2 < 6.28){
              if (rightmost_angle < angle2){
                veiled.add(JSON.stringify(point2));
              }
            }
          }
          if (angle2 < rightmost_angle && angle2 > leftmost_angle){
            veiled.add(JSON.stringify(point2));
          }
        }
      });

      // console.log("iter rays: ", rays);
      // console.log("excluded: ", veiled);

    });

    rays.sort((a, b) => {
      if(a[1][0] < b[1][0]){
        return -1;
      }
      else if (a[1][0] === b[1][0]){
        if(a[1][1] < b[1][1]){
          return -1;
        }
        else {
          return 1;
        }
      }
      else {
        return 1;
      }
    });
    // console.log("sorted rays: ", rays);
    return rays;
  }

}

export class GameBase {

  private app: Application;
  private controller: Controller | null = null;
  private width = 1700;
  private height = 900;

  private camera!: Camera;

  private _lock: boolean = false;

  /**
   * Preloads assets
   */
  private async preload() {
    const assets = [
      { alias: "bunny", src: "https://pixijs.com/assets/bunny.png" }
    ];

    await Assets.load(assets);
  }

  constructor(app: Application) {
    this.app = app;
  }

  getRandomInt(max: number) {
    return Math.floor(Math.random() * max)+10;
  }

  generateMap(){
    let map_layout = []
    for (let i = 20; i <= this.width; i+= 100){
      for (let j = 20; j <= this.height; j+= 100){
        map_layout.push([i, j, i+this.getRandomInt(70), j+this.getRandomInt(70)]);
      }
    }
    return map_layout;
  }

  async run(a: any) {
    await this.preload();
    // console.log(a);

    this.controller = new Controller();
    this.camera = new Camera(this.app);

    // const firstBunny = new FollowableBunny(this.app.screen.width / 2, this.app.screen.height / 2);
    // const secondBunny = new FollowableBunny(25, 25);

    // firstBunny.addToContainer(this.camera.container);
    // secondBunny.addToContainer(this.camera.container);

    // firstBunny.position.x = this.app.screen.width / 2;
    // firstBunny.position.y = this.app.screen.height / 2;
    
    this.camera.setPosition(0, 0);

    let obs = [[100,100,120,120,120,100],[300,300,350,350,350,300],[200,250,250,300,250,250]]
    let mLight = new MaskLight(obs);
    mLight.setPosition(140,140);
    const myPosition = new Graphics().rect(140,140, 3, 3).fill({ color: "green"});
    mLight.createRays();
    console.log("Output polygon: ", mLight.outputPolygon);
    let segment: number[] = [];
    mLight.outputPolygon.forEach( (point) => {
      segment.push(point[0]);
      segment.push(point[1]);
    });

    const lightPolygon = new Graphics().poly(segment).fill({ color: "yellow" });


    // this.camera.follow(firstBunny);

    const radius = 250;
    const shiftEdges = 100;

    const hiddenContainer = new Container();
    hiddenContainer.zIndex = 100;

    // const darkenLayer = new Graphics().rect(0, 0, this.app.screen.width + 0, this.app.screen.height + 0).fill({ color: 0x000000, alpha: 0.5 });

    // const layout = this.generateMap();
    // let offset = 4;
    // let all_segments = [];
    // layout.forEach( (segment) => {
    //   all_segments.push([segment[0], segment[1], segment[2], segment[3], segment[2] + offset, segment[3], segment[0]+offset, segment[1]]);
    //   const rect = new Graphics().poly(all_segments.at(all_segments.length-1)!).fill({ color: "black" });
    //   hiddenContainer.addChild(rect);
    // });
    hiddenContainer.addChild(lightPolygon);
    obs.forEach( (obstacle) => {
      const rect = new Graphics().poly(obstacle).fill({ color: "black" });
      hiddenContainer.addChild(rect);
    });
    hiddenContainer.addChild(myPosition);
    // const basePoint = new Graphics().rect(200,100, 2, 2).fill({ color: "black"});
    // const line = new Graphics().rect(200,100, 5, 100).fill({ color: "black"});
    // const line2 = new Graphics().poly([100,100,200,200, 200,100,100,100]).fill({ color: "black"});
    // line2.angle = 90;
    // line2.x = 200;
    // line2.y = -50;
    // line.angle = 0;
    this.app.stage.addChild(hiddenContainer);
    // hiddenContainer.addChild(line);
    // hiddenContainer.addChild(line2);
    // hiddenContainer.addChild(basePoint);

    // this.app.stage.addChild(hiddenContainer);
    // hiddenContainer.addChild(darkenLayer);

    // const maskDarkLayer = new Graphics()
    //   .rect(-shiftEdges, -shiftEdges, this.app.screen.width + 2*shiftEdges, this.app.screen.height + 2*shiftEdges)
    //   .fill({ color: 0xff0000 })
    //   .circle(this.app.screen.width / 2 + 0, this.app.screen.height / 2 + 0, radius)
    //   .cut();


    // const blurDarkLayer = new BlurFilter({
    //   kernelSize: 9,
    //   quality: 64,
    //   strength: 64,
    // });
    // blurDarkLayer.repeatEdgePixels = false;

    // maskDarkLayer.filters = [blurDarkLayer];

    // const bounds = new Rectangle(0, 0, this.app.screen.width, this.app.screen.height);
    // const texture = this.app.renderer.generateTexture({
    //   target: maskDarkLayer,
    //   resolution: 1,
    //   frame: bounds,
    // });
    // const focusDarkLayer = new Sprite(texture);
    // this.app.stage.addChild(focusDarkLayer);
    // darkenLayer.mask = focusDarkLayer;

    
    // const maskGame = new Graphics()
    //   .rect(0,0, this.app.screen.width, this.app.screen.height)
    //   .fill({ color: 0x500000 })
    //   .circle(this.app.screen.width / 2, this.app.screen.height / 2, radius)
    //   .fill({ color: 0xff0000 });

    // const blurGame = new BlurFilter({
    //   kernelSize: 9,
    //   quality: 64,
    //   strength: 64,
    // });

    // maskGame.filters = [blurGame];

    // const boundsGame = new Rectangle(0, 0, this.app.screen.width, this.app.screen.height);
    // const textureGame = this.app.renderer.generateTexture({
    //   target: maskGame,
    //   resolution: 1,
    //   frame: boundsGame,
    // });
    // const focusGame = new Sprite(textureGame);
    // this.app.stage.addChild(focusGame);
    // this.camera.filterContainer.mask = focusGame;
    
    this.app.ticker.add((time) => {
      
      // const bunny = this.camera.followedObject as FollowableBunny;
      
      // focus1.x = this.app.screen.width / 2 - bunny.x;
      // focus1.y = this.app.screen.height / 2 - bunny.y;
      
      // console.log(this.camera.filterContainer.getBounds());
      
      // bunny.rotation += 0.1 * time.deltaTime;

      // for every Key values change bunny position
      // Object.values(Key).filter(v => typeof v === "number").forEach( keyVal => {
      //   const key = keyVal as Key;

      //   if (this.controller?.keys[key].pressed) {
      //     switch (key) {
      //       case Key.UP:
      //         bunny.y -= 5 * time.deltaTime;
      //         break;
      //       case Key.DOWN:
      //         bunny.y += 5 * time.deltaTime;
      //         break;
      //       case Key.LEFT:
      //         bunny.x -= 5 * time.deltaTime;
      //         break;
      //       case Key.RIGHT:
      //         bunny.x += 5 * time.deltaTime;
      //         break;
      //       case Key.Q:
      //         // swap following bunny
      //         if (!this._lock){
      //           this.camera.follow(this.camera.followedObject === firstBunny ? secondBunny : firstBunny);
      //           this._lock = true;
      //         }
      //     }
      //   }

      //   if (key === Key.Q && this.controller?.keys[key].pressed === false && this._lock) {
      //     this._lock = false;
      //   }
      // });


    });
  }

  stop(){
    this.controller?.destructor();
    this.controller = null;
  }
}