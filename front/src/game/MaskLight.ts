/***
Credits to:
https://www.redblobgames.com/articles/visibility/?fbclid=IwAR1CBNXS8KEEIdM0YJnN8t-k6mS5-2QG5a1j1GFt_dNeMwYTsnSRHCHdMb0
and
https://github.com/akapkotel/light_raycasting
***/


class Point {
  x: number;
  y: number;
  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
}

export class MaskLight {
  private position = [0, 0];
  private borders: any[] = [];
  private walls_m: Map<number, any> = new Map();
  private points_m: Map<number, any> = new Map();
  private points_begin_m: Map<number, any> = new Map();
  private points_end_m: Map<number, any> = new Map();
  outputPolygon: number[][] = [];
  private SCREEN_WIDTH = 0;
  private SCREEN_HEIGHT = 0;

  hashFunction(point: number[]) {
    let lhs = Math.round(point[0]*1000)*1000000
    let rhs = Math.round(point[1]*1000)
    return lhs + rhs
  }

  checkBorder(wall: any) {
    let result = false;
    this.borders.forEach((border) => {
      if (result) return;
      if (wall[0] === border[0] && wall[1] === border[1]) {
        result = true;
      }
    });
    return result;
  }

  checkBorderPoint(point: number[]) {
    let result = false;
    this.borders.forEach((border) => {
      if (result) return;
      if (point === border[0] || point === border[1]) {
        result = true;
      }
    });
    return result;
  }

  getIdFromPoint(point: number[]) {
    return String(point[0]) + "," + String(point[1]);
  }

  constructor(obstacles: any[], width: number, height: number) {
    this.SCREEN_WIDTH = width;
    this.SCREEN_HEIGHT = height;
    // this.borders = [[[this.SCREEN_WIDTH, 0], [0, 0]], [[this.SCREEN_WIDTH, this.SCREEN_HEIGHT], [this.SCREEN_WIDTH, 0]], [[0, this.SCREEN_HEIGHT], [this.SCREEN_WIDTH, this.SCREEN_HEIGHT]], [[0, 0], [0, this.SCREEN_HEIGHT]]];
    this.borders =[]// [[[this.SCREEN_WIDTH+10, -10], [-10, -10]], [[this.SCREEN_WIDTH+10, this.SCREEN_HEIGHT+10], [this.SCREEN_WIDTH+10, -10]], [[-10, this.SCREEN_HEIGHT+10], [this.SCREEN_WIDTH+10, this.SCREEN_HEIGHT+10]], [[-10, -10], [-10, this.SCREEN_HEIGHT+10]]];
    this.initialize(obstacles);
  }

  initialize(obstacles: any[]) {
    this.walls_m = new Map();
    this.points_m = new Map();
    this.points_begin_m = new Map();
    this.points_end_m = new Map();
    this.outputPolygon = [];

    this.borders.forEach((border) => {
      let center = this.getCenterOfWall(border);
      border.push(center);
      this.walls_m.set(this.hashFunction(center), border);
    });

    this.addObstacles(obstacles)
    
  }

  addObstacles(obstacles: any[]) {
    obstacles.forEach((obstacle) => {
      this.addObstacle(obstacle);
    });
  }

  removeObstacles(obstacles: any[]) {
    obstacles.forEach((obstacle) => {
      this.removeObstacle(obstacle);
    });
  }

  vectorLength(startPoint: any, endPoint: any) {
    return Math.sqrt(Math.pow(endPoint[0] - startPoint[0], 2) + Math.pow(endPoint[1] - startPoint[1], 2));
  }

  angleBetweenVectors(startPoint: any, endPoint: any) {
    return -Math.atan2(endPoint[0] - startPoint[0], endPoint[1] - startPoint[1]);
    // return -Math.atan2(endPoint[1] - startPoint[1], endPoint[0] - startPoint[0]);
  }

  calculate_vector_2d(angle: number, scalar: number) {
    let change_y = Math.cos(angle);
    let change_x = Math.sin(angle);
    return [change_x * scalar, change_y * scalar];
  }

  moveTowardsPoint(startPoint: any, endPoint: any, velocity: number) {
    const angle = this.angleBetweenVectors(startPoint, endPoint);
    const v = this.calculate_vector_2d(angle, velocity);

    return [startPoint[0] + v[0], startPoint[1] + v[1]];
  }

  moveUsingAngle(startPoint: any, angle: number, velocity: number) {
    const v = this.calculate_vector_2d(angle, velocity);
    return [startPoint[0] + v[0], startPoint[1] + v[1]];
  }

  checkOrientation(point1: number[], point2: number[], point3: number[]) {
    return ((point2[1] - point1[1]) * (point3[0] - point2[0]) - (point2[0] - point1[0]) * (point3[1] - point2[1])) > 0;
  }

  onSegment(p1: number[], p2: number[], q: number[]) {
    return (q[0] <= Math.max(p1[0], p2[0]) && q[0] >= Math.min(p1[0], p2[0]) && q[1] <= Math.max(p1[1], p2[1]) && q[1] >= Math.min(p1[1], p2[1]));
  }

  intersection(wall1: any, wall2: any) {
    let o1 = this.checkOrientation(wall1[0], wall1[1], wall2[0]);
    let o2 = this.checkOrientation(wall1[0], wall1[1], wall2[1]);
    let o3 = this.checkOrientation(wall2[0], wall2[1], wall1[0]);
    let o4 = this.checkOrientation(wall2[0], wall2[1], wall1[1]);

    if (o1 != o2 && o3 != o4) {
      return true;
    }

    if (o1 == false && this.onSegment(wall1[0], wall1[1], wall2[0])) {
      return true;
    }
    if (o2 == false && this.onSegment(wall1[0], wall1[1], wall2[1])) {
      return true;
    }
    if (o3 == false && this.onSegment(wall2[0], wall2[1], wall1[0])) {
      return true;
    }
    if (o4 == false && this.onSegment(wall2[0], wall2[1], wall1[1])) {
      return true;
    }
    return false;
  }


  pointOfIntersection(wall1: any, wall2: any) {
    let x1 = wall1[0][0];
    let y1 = wall1[0][1];
    let x2 = wall1[1][0];
    let y2 = wall1[1][1];
    let x3 = wall2[0][0];
    let y3 = wall2[0][1];
    let x4 = wall2[1][0];
    let y4 = wall2[1][1];

    let alpha = ((x4 - x3) * (y3 - y1) - (y4 - y3) * (x3 - x1))/((x4 - x3) * (y2 - y1) - (y4 - y3) * (x2 - x1));
    // let beta = ((x2-x1)*(y3-y1) - (y2-y1)*(x3-x1))/((x4-x3)*(y2-y1) - (y4-y3)*(x2-x1));
    let x0 = x1 + alpha * (x2 - x1);
    let y0 = y1 + alpha * (y2 - y1);

    // let a1 = y2 - y1;
    // let b1 = x1 - x2;
    // let c1 = a1 * x1 + b1 * y1;
    // let a2 = y4 - y3;
    // let b2 = x3 - x4;
    // let c2 = a2 * x3 + b2 * y3;

    // let det = a1 * b2 - a2 * b1;
    // let x = (b2 * c1 - b1 * c2) / det;
    // let y = (a1 * c2 - a2 * c1) / det;

    // return [x, y];
    return [x0, y0];
  }

  degrees(rad: number) {
    let result = (rad * 180 / Math.PI) % 360;
    if (result < 0) {
      result = 360 + result;
    }
    return result;
  }

  getCenterOfWall(wall: any){
    return [(wall[0][0] + wall[1][0]) / 2, (wall[0][1] + wall[1][1]) / 2];
  }

  addObstacle(obstacle: any) {
    for (let i = 0; i < obstacle.length - 2; i += 2) {
      this.setWall(obstacle, i, i + 1, i + 2, i + 3);
    }

    if (obstacle.length > 4) {
      // for full obstacle
      this.setWall(obstacle, obstacle.length - 2, obstacle.length - 1, 0, 1);
    }

    if (obstacle.length === 4) {
      // for double edge obstacle
      this.setWall(obstacle, 2, 3, 0, 1);
    }

  }

  removeObstacle(obstacle: any) {
    for (let i = 0; i < obstacle.length - 2; i += 2) {
      this.removeWall(obstacle, i, i + 1, i + 2, i + 3);
    }

    if (obstacle.length > 4) {
      // for full obstacle
      this.removeWall(obstacle, obstacle.length - 2, obstacle.length - 1, 0, 1);
    }

    if (obstacle.length === 4) {
      // for double edge obstacle
      this.removeWall(obstacle, 2, 3, 0, 1);
    }

  }

  setPosition(x: number, y: number) {
    this.position = [x, y];
  }

  toRadians(degrees: number) {
    return degrees * Math.PI / 180;
  }

  setWall(obstacle: any, x1: number, y1: number, x2: number, y2: number) {
    let wall = [[obstacle[x1], obstacle[y1]], [obstacle[x2], obstacle[y2]]];
    this.setCenterAndAddWall(wall);
    this.setPointFromWall(wall);
  }

  removeWall(obstacle: any, x1: number, y1: number, x2: number, y2: number){
    let wall = [[obstacle[x1], obstacle[y1]], [obstacle[x2], obstacle[y2]]];
    let centerOfWall = this.getCenterOfWall(wall);
    this.walls_m.delete(this.hashFunction(centerOfWall));

    if(this.points_m.has(this.hashFunction(wall[0]))){
      this.points_m.delete(this.hashFunction(wall[0]));
    }

    if(this.points_m.has(this.hashFunction(wall[1]))){
      this.points_m.delete(this.hashFunction(wall[1]));
    }

    this.points_begin_m.delete(this.hashFunction(wall[0]));
    this.points_end_m.delete(this.hashFunction(wall[1]));
  }

  setCenterAndAddWall(wall: any) {
    let centerOfWall = this.getCenterOfWall(wall);
    wall.push(centerOfWall);
    this.walls_m.set(this.hashFunction(centerOfWall), wall);
  }

  setPointFromWall(wall: any) {
    if(!this.points_m.has(this.hashFunction(wall[0]))){
      this.points_m.set(this.hashFunction(wall[0]), wall[0]);
    }

    if (!this.points_m.has(this.hashFunction(wall[1]))) {
      this.points_m.set(this.hashFunction(wall[1]), wall[1]);
    }

    this.points_begin_m.set(this.hashFunction(wall[0]), wall);
    this.points_end_m.set(this.hashFunction(wall[1]), wall);
  }

  createRays() {

    let createRaysStart = performance.now()
    this.outputPolygon = [];

    let walls = Array.from(this.walls_m.values());
    walls.sort((a, b) => {
      if (this.vectorLength(this.position, a[2]) < this.vectorLength(this.position, b[2])) {
        return -1;
      } else {
        return 1;
      }
    });

    console.log("walls: ", walls)

    let rays = this.prepareRays();

    rays.forEach((ray) => {
      let pt = ray[1];
      if(pt[0] < 410 && pt[0] > 310 && pt[1] < 1290 && pt[1] > 1210){
        console.log("edge ray: ", ray)
      }
    });

    rays.forEach((ray) => {
      let pt = ray[1];
      if(pt[0] < 100 && pt[0] >=0 && pt[1] < 1400 && pt[1] > 1350){
        console.log("corner ray: ", ray)
      }
    });

    let otherRays: number[][][] = [];
    let newRays: number[][][] = [];
    let collision: Set<number[][]> = new Set();
    let collision_m: Map<number, number[][]> = new Map();

      walls.forEach((wall) => {
        let filteredRays = rays.filter((ray) => {
          return this.checkOrientation(this.position, wall[1], ray[1]) &&
            !this.checkOrientation(this.position, wall[0], ray[1]);
        });

        for (let idx = 0; idx < filteredRays.length; idx++) {
          let ray = filteredRays[idx];
          if (collision_m.has(this.hashFunction(ray[1]))) {
            continue;
          }
          if (collision.has(ray)) {
            continue;
          }

          if (this.intersection(wall, ray)) {
            let endRay = ray[1];
            if (this.points_m.has(this.hashFunction(endRay))) {
              let wall1 = this.points_begin_m.get(this.hashFunction(endRay));
              let wall2 = this.points_end_m.get(this.hashFunction(endRay));
              if (wall !== wall1 && wall !== wall2) {
                collision.add(ray);
                collision_m.set(this.hashFunction(ray[1]), ray);
                endRay = this.pointOfIntersection(ray, wall);
                if( endRay !== ray[1]) rays.push([this.position, endRay]);
                // if(endRay[0] < 100 && endRay[0] >=0 && endRay[1] < 1400 && endRay[1] > 1350){
                //   console.log("1: corner endRay: ", endRay, " wall: ", wall, " ray: ", ray)
                // }
                // if(endRay[0] < 410 && endRay[0] > 310 && endRay[1] < 1290 && endRay[1] > 1210){
                //   console.log("1: edge endRay: ", endRay, " wall: ", wall, " ray: ", ray)
                // }
                otherRays.push([this.position, endRay]);
              }
            }
            else {
              collision.add(ray);
              collision_m.set(this.hashFunction(ray[1]), ray);
              endRay = this.pointOfIntersection(ray, wall);
              if( endRay !== ray[1] )
                rays.push([this.position, endRay]);
              if(endRay[0] < 100 && endRay[0] >=0 && endRay[1] < 1400 && endRay[1] > 1350){
                console.log("2: corner endRay: ", endRay, " wall: ", wall, " ray: ", ray)
              }
              if(endRay[0] < 410 && endRay[0] > 310 && endRay[1] < 1290 && endRay[1] > 1210){
                console.log("2: edge endRay: ", endRay, " wall: ", wall, " ray: ", ray)
              }
              otherRays.push([this.position, endRay]);
            }
          }

        }

      });

    console.log("collision: ", collision)
    let i = 0;
    let filteredRays: number[][][] = [];
    rays.forEach((ray) => {
      // if (!collision.has(ray)) {
      if(!collision_m.has(this.hashFunction(ray[1]))){
        let endRay = ray[1];
        if(endRay[0] < 100 && endRay[0] >=0 && endRay[1] < 1400 && endRay[1] > 1350){
          console.log("3: corner ray: ", endRay, " ray: ", ray)
        }
        filteredRays.push(ray);
      }
      // else{
        // console.log("removed ray: ", ray)
      // }
    });
    otherRays.forEach((ray) => {
      // if (!collision.has(ray)) {
      if(!collision_m.has(this.hashFunction(ray[1]))){
        let endRay = ray[1];
        if(endRay[0] < 100 && endRay[0] >=0 && endRay[1] < 1400 && endRay[1] > 1350){
          console.log("4: corner ray: ", endRay, " ray: ", ray)
        }
        filteredRays.push(ray);
      }
    });
    // console.log("removed rays: ", i)
    // filteredRays = filteredRays.concat(otherRays);

    filteredRays.sort((a, b) => {
      if (this.angleBetweenVectors(this.position, a[1]) < this.angleBetweenVectors(this.position, b[1])) {
        return -1;
      } else {
        return 1;
      }
    });

    filteredRays.forEach((ray) => {
      this.outputPolygon.push(ray[1]);
    });

    let createRaysEnd = performance.now()
    console.log("Time to create rays: ", createRaysEnd - createRaysStart, 'ms')

  }

  prepareRays() {
    let rays: number[][][] = [];
    let rightmost_angle = 0;
    let leftmost_angle = 0;
    let veiled: Set<number> = new Set();

    this.points_m.forEach((point) => {
      let angle = this.angleBetweenVectors(this.position, point);

      if (veiled.has(this.hashFunction(point))) return;

      if (this.checkBorderPoint(point)) {
        rays.push([this.position, point]);
        return;
      }

      let wall = this.points_begin_m.get(this.hashFunction(point));
      if(wall !== undefined){
      if (this.checkOrientation(this.position, point, wall[1])) {
        let passAngle = -this.toRadians(this.degrees(angle) + 0.01);
        let end = this.moveUsingAngle(this.position, passAngle, 2500);
        rays.push([this.position, end]);
        rightmost_angle = angle;
      }
      else {
        rightmost_angle = this.angleBetweenVectors(this.position, wall[1]);
      }
    }

      rays.push([this.position, point]);

      wall = this.points_end_m.get(this.hashFunction(point));
      if(wall !== undefined){
      if (!this.checkOrientation(this.position, point, wall[0])) {
        let passAngle = -this.toRadians(this.degrees(angle) - 0.01);
        let end = this.moveUsingAngle(this.position, passAngle, 2500);
        rays.push([this.position, end]);
        leftmost_angle = angle;
      }
      else {
        leftmost_angle = this.angleBetweenVectors(this.position, wall[0]);
      }
    }

    this.points_m.forEach((point) => {
        if (this.vectorLength(this.position, point) > this.vectorLength(this.position, point)) {
          let angle2 = this.angleBetweenVectors(this.position, point);

          if (leftmost_angle > rightmost_angle) {
            if (leftmost_angle < angle2 && angle2 < 6.28) {
              if (rightmost_angle < angle2) {
                veiled.add(this.hashFunction(point));
              }
            }
          }
          if (angle2 < rightmost_angle && angle2 > leftmost_angle) {
            veiled.add(this.hashFunction(point));
          }
        }
      });

    });

    return rays;
  }

}
