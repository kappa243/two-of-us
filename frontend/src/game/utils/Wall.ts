import {Point} from "pixi.js";

export class Wall {
  begin: Point;
  end: Point;
  constructor(begin: Point, end: Point) {
    this.begin = begin;
    this.end = end;
  }

  get length() {
    return Math.sqrt(Math.pow(this.end.x - this.begin.x, 2) + Math.pow(this.end.y - this.begin.y, 2));
  }

  returnCoordinatXhavingY(y: number) {
    return this.begin.x + (y - this.begin.y) * (this.end.x - this.begin.x) / (this.end.y - this.begin.y);
  }

  returnCoordinatYhavingX(x: number) {
    return this.begin.y + (x - this.begin.x) * (this.end.y - this.begin.y) / (this.end.x - this.begin.x);
  }
}