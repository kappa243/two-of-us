import { IFollower } from "./IFollower";

export interface IFollowable<T> {
  subscribe(follower: IFollower<T>): void;
  unsubscribe(follower: IFollower<T>): void;
}