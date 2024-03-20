import { IFollowable } from "./IFollowable";

export interface IFollower<T> {
  _notify(data: T): void;
  follow(observer: IFollowable<T>): void;
  get followedObject(): IFollowable<T> | null;
  unfollow(): void;
}