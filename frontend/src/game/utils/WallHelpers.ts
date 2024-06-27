import {Wall} from "@/game/utils/Wall";
import {Point} from "pixi.js";

export class WallHelpers {

  static checkOrientation(point1: number[], point2: number[], point3: number[]) {
    return ((point2[1] - point1[1]) * (point3[0] - point2[0]) - (point2[0] - point1[0]) * (point3[1] - point2[1])) > 0;
  }

  static onSegment(p1: number[], p2: number[], q: number[]) {
    return (q[0] <= Math.max(p1[0], p2[0]) && q[0] >= Math.min(p1[0], p2[0]) && q[1] <= Math.max(p1[1], p2[1]) && q[1] >= Math.min(p1[1], p2[1]));
  }

  static intersection(walla: any, wallb: any) {
    let wall1 = [[walla[0], walla[1]], [walla[2], walla[3]]];
    let wall2 = [[wallb[0], wallb[1]], [wallb[2], wallb[3]]];
    let o1 = WallHelpers.checkOrientation(wall1[0], wall1[1], wall2[0]);
    let o2 = WallHelpers.checkOrientation(wall1[0], wall1[1], wall2[1]);
    let o3 = WallHelpers.checkOrientation(wall2[0], wall2[1], wall1[0]);
    let o4 = WallHelpers.checkOrientation(wall2[0], wall2[1], wall1[1]);

    if (o1 != o2 && o3 != o4) {
      return true;
    }

    if (o1 == false && WallHelpers.onSegment(wall1[0], wall1[1], wall2[0])) {
      return true;
    }
    if (o2 == false && WallHelpers.onSegment(wall1[0], wall1[1], wall2[1])) {
      return true;
    }
    if (o3 == false && WallHelpers.onSegment(wall2[0], wall2[1], wall1[0])) {
      return true;
    }
    if (o4 == false && WallHelpers.onSegment(wall2[0], wall2[1], wall1[1])) {
      return true;
    }
    return false;
  }

  static detectMovingBoxCollision(moving_box: number[], actual_borders: number[]) {
    if (actual_borders.length === 0){
      return true;
    }
    if(moving_box[0] <= actual_borders[0] || moving_box[2] >= actual_borders[2] || moving_box[1] <= actual_borders[1] || moving_box[3] >= actual_borders[3]){
      return true;
    }
    return false;
  }
  
}
