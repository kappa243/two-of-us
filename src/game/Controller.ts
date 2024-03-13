export enum Key {
  UP = 0,
  DOWN,
  LEFT,
  RIGHT,
}

const keyMap: { [key: string]: Key } = {
  KeyW: Key.UP,
  ArrowUp: Key.UP,
  KeyA: Key.LEFT,
  ArrowLeft: Key.LEFT,
  KeyS: Key.DOWN,
  ArrowDown: Key.DOWN,
  KeyD: Key.RIGHT,
  ArrowRight: Key.RIGHT,
};

export interface KeyProps {
  pressed: boolean;
}

const KeyPropsDefault: KeyProps = {
  pressed: false,
};

export class Controller {
  keys: Record<Key, KeyProps>;

  constructor() {
    this.keys = {
      [Key.UP]: { ...KeyPropsDefault },
      [Key.DOWN]: { ...KeyPropsDefault },
      [Key.LEFT]: { ...KeyPropsDefault },
      [Key.RIGHT]: { ...KeyPropsDefault },
    };

    window.addEventListener("keydown", (event) => this.keydownHandler(event));
    window.addEventListener("keyup", (event) => this.keyupHandler(event));
  }

  private getKeyProps(code: string): KeyProps | undefined {
    const keyCode = keyMap[code];
    return this.keys[keyCode];
  }

  keydownHandler(event: KeyboardEvent) {
    const key = this.getKeyProps(event.code);

    if (key)
      key.pressed = true;
  }
  
  keyupHandler(event: KeyboardEvent) {
    const key = this.getKeyProps(event.code);

    if (key)
      key.pressed = false;
  }

}