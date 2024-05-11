/***
Credits to:
https://www.redblobgames.com/articles/visibility/?fbclid=IwAR1CBNXS8KEEIdM0YJnN8t-k6mS5-2QG5a1j1GFt_dNeMwYTsnSRHCHdMb0
and
https://github.com/akapkotel/light_raycasting
***/

import { start } from "repl";
import { formatWithOptions } from "util";

class Point{
    x: number;
    y: number;
    constructor(x: number, y: number){
        this.x = x;
        this.y = y;
    }
}

export class MaskLight {
    private position = [0,0];
    private borders: any[] = [];
    private walls: any[] = [];
    private wallsCenter: { [id: number] : number[]; } = {};
    private points: Set<Point> = new Set();
    private points_begin: any[] = [];
    private points_end: any[] = [];
    outputPolygon: number[][] = [];
    private SCREEN_WIDTH = 0;
    private SCREEN_HEIGHT = 0;
  
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
  
    constructor(obstacles: any[], width: number, height: number) {
      this.SCREEN_WIDTH = width;
      this.SCREEN_HEIGHT = height;
      this.borders = [[[this.SCREEN_WIDTH, 0], [0, 0]], [[this.SCREEN_WIDTH, this.SCREEN_HEIGHT], [this.SCREEN_WIDTH, 0]], [[0, this.SCREEN_HEIGHT], [this.SCREEN_WIDTH, this.SCREEN_HEIGHT]], [[0, 0], [0, this.SCREEN_HEIGHT]]]; 
      this.initialize(obstacles);
    }

    initialize(obstacles: any[]){

      this.walls = [];
      this.wallsCenter = {};
      this.points = new Set();
      this.points_begin = [];
      this.points_end = [];
      this.outputPolygon = [];

      this.borders.forEach( (border) => {
        this.walls.push(border);
      });
  
      this.walls.forEach( (wall, idx) => {
        let halfLength = this.vectorLength(wall[0], wall[1]) / 2;
        let direction = this.angleBetweenVectors(wall[0], wall[1]);
        let center = this.moveUsingAngle(wall[0], -direction, halfLength);
        this.wallsCenter[idx] = center;
      });
  
      obstacles.forEach( (obstacle) => {
        this.addObstacle(obstacle);
      });
      
      this.setPoints(); 

    }
  
    vectorLength(startPoint: any, endPoint: any){
      return Math.sqrt(Math.pow(endPoint[0] - startPoint[0], 2) + Math.pow(endPoint[1] - startPoint[1], 2));
    }
  
    angleBetweenVectors(startPoint: any, endPoint: any){
      return -Math.atan2(endPoint[0] - startPoint[0], endPoint[1] - startPoint[1]);
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
  
    addObstacle(obstacle: any) {
      for(let i = 0; i<obstacle.length-2; i+=2){
        let wall = [[obstacle[i], obstacle[i+1]], [obstacle[i+2], obstacle[i+3]]];
        this.walls.push(wall);
        let halfLength = this.vectorLength(wall[0], wall[1]) / 2
        let direction = this.angleBetweenVectors(wall[0], wall[1])
        let center = this.moveUsingAngle(wall[0], -direction, halfLength)
        this.wallsCenter[Object.keys(this.wallsCenter).length] = center

        if(obstacle.length > 4){
        // for full obstacle
          if (i === obstacle.length-4 && i !== 0){
            let wall = [[obstacle[i+2], obstacle[i+3]], [obstacle[0], obstacle[1]]];
            this.walls.push(wall);
            let halfLength = this.vectorLength(wall[0], wall[1]) / 2
            let direction = this.angleBetweenVectors(wall[0], wall[1])
            let center = this.moveUsingAngle(wall[0], -direction, halfLength)
            this.wallsCenter[Object.keys(this.wallsCenter).length] = center
          }
        }

        if(obstacle.length === 4){
          // for double edge obstacle
          wall = [[obstacle[i+2], obstacle[i+3]], [obstacle[i], obstacle[i+1]]];
          this.walls.push(wall);
          halfLength = this.vectorLength(wall[0], wall[1]) / 2
          direction = this.angleBetweenVectors(wall[0], wall[1])
          center = this.moveUsingAngle(wall[0], -direction, halfLength)
          this.wallsCenter[Object.keys(this.wallsCenter).length] = center
        }
      }
    }

    getWallFromArray(arr: any[], point: number[]){
      for(let i = 0; i<arr.length; i++){
        if(arr[i][0][0] === point[0] && arr[i][0][1] === point[1]){
          return arr[i][1];
        }
      }
      return null;
    }
  
    setPosition(x: number, y: number) {
      this.position = [x, y];
    }
  
    toRadians(degrees: number){
      return degrees * Math.PI / 180;
    }
  
    setPoints(){
      this.walls.forEach( (wall, idx) => {
        if(!this.points.has(new Point(wall[0][0], wall[0][1]))){
          this.points.add(new Point(wall[0][0], wall[0][1]));
        }
        this.points_begin.push([wall[0], wall]);
        if(!this.points.has(new Point(wall[1][0], wall[1][1]))){
          this.points.add(new Point(wall[1][0], wall[1][1]));
        }
        this.points_end.push([wall[1], wall]);
      });
    }
  
    createRays(){
      let points = Array.from(this.points);
      points.sort((a, b) => {
        let aa = [a.x, a.y];
        let bb = [b.x, b.y];
        if (this.degrees(this.angleBetweenVectors(this.position, aa)) < this.degrees(this.angleBetweenVectors(this.position, bb))){
          return -1;
        } else {
          return 1;
        }
      });

  
      let walls = Array.from(this.walls);
      for(let i = 0; i < walls.length; i++){
        walls[i].push(this.wallsCenter[i]);
      }
  
      walls.sort((a, b) => {
        if (this.vectorLength(this.position, a[2]) < this.vectorLength(this.position, b[2])){
          return -1;
        } else {
          return 1;
        }
      });

      let rays = this.prepareRays();
      let otherRays: number[][][] = [];
      let collision: Set<number[][]> = new Set();

      walls.forEach( (wall) => {
        let filteredRays = rays.filter( (ray) => {
          return this.checkOrientation(this.position, wall[1], ray[1]) &&
            !this.checkOrientation(this.position, wall[0], ray[1]);
        });

        for(let idx = 0; idx < filteredRays.length; idx++){
          let ray = filteredRays[idx];
          if( collision.has(ray) ){
            continue;
          }
  
          if(this.intersecttion(wall, ray)){
            let endRay = ray[1];
            if(this.points.has(new Point(endRay[0], endRay[1]))) {
              let wall1 = this.getWallFromArray(this.points_begin, endRay);
              let wall2 = this.getWallFromArray(this.points_end, endRay);
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
        let point = [point1.x, point1.y];
        let angle = this.angleBetweenVectors(this.position, point);

        if (veiled.has(JSON.stringify(point))) return;
        if (this.checkBorderPoint(point)) { 
          rays.push([this.position, point]);
          return; 
        }
  
        let wall = this.getWallFromArray(this.points_begin, point);
        if (this.checkOrientation(this.position, point, wall[1])) {
          let passAngle = -this.toRadians(this.degrees(angle)+0.05);
          let end = this.moveUsingAngle(this.position, passAngle, 1500);
          rays.push([this.position, end]);
          rightmost_angle = angle
        }
        else {
          rightmost_angle = this.angleBetweenVectors(this.position, wall[1]);
        }
  
        rays.push([this.position, point]);
  
        wall = this.getWallFromArray(this.points_end, point);
        if (!this.checkOrientation(this.position , point, wall[0])){
          let passAngle = -this.toRadians(this.degrees(angle)-0.05);
          let end = this.moveUsingAngle(this.position, passAngle, 1500);
          rays.push([this.position, end]);
          leftmost_angle = angle
        }
        else {
          leftmost_angle = this.angleBetweenVectors(this.position, wall[0]);
        }
        
  
        this.points.forEach( (point22) => {
          let point2 = [point22.x, point22.y];
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

      return rays;
    }
  
  }
  