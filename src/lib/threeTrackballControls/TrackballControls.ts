import * as THREE from "three";

const STATE = {
  NONE: -1,
  ROTATE: 0,
  ZOOM: 1,
  PAN: 2,
  TOUCH_ROTATE: 3,
  TOUCH_ZOOM_PAN: 4,
};
const CHANGE_EVENT = { type: "change" };
const START_EVENT = { type: "start" };
const END_EVENT = { type: "end" };

const EPS = 0.000001;

const LAST_POSITION = new THREE.Vector3();
const LAST_ZOOM = { value: 1 };

export default class TrackballControls extends THREE.EventDispatcher {
  camera: THREE.PerspectiveCamera | THREE.OrthographicCamera;
  domElement: HTMLElement;
  window: Window;

  // API
  enabled: boolean;
  screen: any;

  rotateSpeed: number;
  zoomSpeed: number;
  panSpeed: number;

  noRotate: boolean;
  noZoom: boolean;
  noPan: boolean;

  staticMoving: boolean;
  dynamicDampingFactor: number;

  minDistance: number;
  maxDistance: number;

  keys: string[];
  mouseButtons: any;
  target: THREE.Vector3;

  private _state: number;
  private _keyState: number;
  private readonly _eye: THREE.Vector3;
  private _movePrev: THREE.Vector2;
  private readonly _moveCurr: THREE.Vector2;
  private readonly _lastAxis: THREE.Vector3;
  private _lastAngle: number;
  private readonly _zoomStart: THREE.Vector2;
  private readonly _zoomEnd: THREE.Vector2;
  private _touchZoomDistanceStart: number;
  private _touchZoomDistanceEnd: number;
  private readonly _panStart: THREE.Vector2;
  private readonly _panEnd: THREE.Vector2;

  private readonly target0: THREE.Vector3;
  private readonly position0: THREE.Vector3;
  private readonly up0: THREE.Vector3;
  private readonly zoom0: number;

  private readonly keydown: EventListener;
  private readonly keyup: EventListener;
  private readonly mousedown: EventListener;
  private readonly mouseup: EventListener;
  private readonly mousemove: EventListener;
  private readonly mousewheel: EventListener;
  private readonly touchstart: EventListener;
  private readonly touchmove: EventListener;
  private readonly touchend: EventListener;
  private readonly contextmenu: EventListener;

  constructor(
    camera: THREE.PerspectiveCamera | THREE.OrthographicCamera,
    domElement: HTMLElement,
    domWindow?: Window
  ) {
    super();

    if (domElement === undefined)
      console.warn(
        'THREE.TrackballControls: The second parameter "domElement" is now mandatory.'
      );

    this.camera = camera;

    this.domElement = domElement;
    this.window = domWindow !== undefined ? domWindow : window;

    // Set to false to disable this control
    this.enabled = true;
    this.screen = { left: 0, top: 0, width: 0, height: 0 };

    this.rotateSpeed = 1.0;
    this.zoomSpeed = 1.2;
    this.panSpeed = 0.3;

    this.noRotate = false;
    this.noZoom = false;
    this.noPan = false;

    this.staticMoving = false;
    this.dynamicDampingFactor = 0.2;

    // How far you can dolly in and out ( PerspectiveCamera only )
    this.minDistance = 0;
    this.maxDistance = Infinity;

    this.keys = ["KeyA" /*A*/, "KeyS" /*S*/, "KeyD" /*D*/];

    // Replace ZOOM by DOLLY (threejs r111)
    this.mouseButtons = {
      LEFT: THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.PAN,
    };

    // "target" sets the location of focus, where the camera orbits around
    this.target = new THREE.Vector3();

    this._state = STATE.NONE;
    this._keyState = STATE.NONE;

    this._eye = new THREE.Vector3();

    this._movePrev = new THREE.Vector2();
    this._moveCurr = new THREE.Vector2();

    this._lastAxis = new THREE.Vector3();
    this._lastAngle = 0;

    this._zoomStart = new THREE.Vector2();
    this._zoomEnd = new THREE.Vector2();

    this._touchZoomDistanceStart = 0;
    this._touchZoomDistanceEnd = 0;

    this._panStart = new THREE.Vector2();
    this._panEnd = new THREE.Vector2();

    this.target0 = this.target.clone();
    this.position0 = this.camera.position.clone();
    this.up0 = this.camera.up.clone();
    this.zoom0 = this.camera.zoom;

    // event handlers - FSM: listen for events and reset state

    this.keydown = (event: Event) => {
      if (!this.enabled) return;
      this.window.removeEventListener("keydown", this.keydown);
      const keyboardEvent = event as KeyboardEvent;
      if (this._keyState !== STATE.NONE) {
        return;
      } else if (
        keyboardEvent.code === this.keys[STATE.ROTATE] &&
        !this.noRotate
      ) {
        this._keyState = STATE.ROTATE;
      } else if (keyboardEvent.code === this.keys[STATE.ZOOM] && !this.noZoom) {
        this._keyState = STATE.ZOOM;
      } else if (keyboardEvent.code === this.keys[STATE.PAN] && !this.noPan) {
        this._keyState = STATE.PAN;
      }
    };

    this.keyup = () => {
      if (!this.enabled) {
        return;
      }
      this._keyState = STATE.NONE;
      this.window.addEventListener("keydown", this.keydown, false);
    };

    this.mousedown = (event: Event) => {
      const mouseEvent = event as MouseEvent;
      if (!this.enabled) {
        return;
      }
      mouseEvent.preventDefault();
      mouseEvent.stopPropagation();
      if (this._state === STATE.NONE) {
        switch (mouseEvent.button) {
          case this.mouseButtons.LEFT:
            this._state = STATE.ROTATE;
            break;
          case this.mouseButtons.MIDDLE:
            this._state = STATE.ZOOM;
            break;
          case this.mouseButtons.RIGHT:
            this._state = STATE.PAN;
            break;
          default:
            this._state = STATE.NONE;
        }
      }
      const state =
        this._keyState !== STATE.NONE ? this._keyState : this._state;

      if (state === STATE.ROTATE && !this.noRotate) {
        this._moveCurr.copy(
          this.getMouseOnCircle(mouseEvent.pageX, mouseEvent.pageY)
        );
        this._movePrev.copy(this._moveCurr);
      } else if (state === STATE.ZOOM && !this.noZoom) {
        this._zoomStart.copy(
          this.getMouseOnScreen(mouseEvent.pageX, mouseEvent.pageY)
        );
        this._zoomEnd.copy(this._zoomStart);
      } else if (state === STATE.PAN && !this.noPan) {
        this._panStart.copy(
          this.getMouseOnScreen(mouseEvent.pageX, mouseEvent.pageY)
        );
        this._panEnd.copy(this._panStart);
      }
      document.addEventListener("mousemove", this.mousemove, false);
      document.addEventListener("mouseup", this.mouseup, false);
      this.dispatchEvent(START_EVENT);
    };

    this.mousemove = (event: Event) => {
      if (!this.enabled) {
        return;
      }
      const mouseEvent = event as MouseEvent;
      mouseEvent.preventDefault();
      mouseEvent.stopPropagation();
      const state =
        this._keyState !== STATE.NONE ? this._keyState : this._state;
      if (state === STATE.ROTATE && !this.noRotate) {
        this._movePrev.copy(this._moveCurr);
        this._moveCurr.copy(
          this.getMouseOnCircle(mouseEvent.pageX, mouseEvent.pageY)
        );
      } else if (state === STATE.ZOOM && !this.noZoom) {
        this._zoomEnd.copy(
          this.getMouseOnScreen(mouseEvent.pageX, mouseEvent.pageY)
        );
      } else if (state === STATE.PAN && !this.noPan) {
        this._panEnd.copy(
          this.getMouseOnScreen(mouseEvent.pageX, mouseEvent.pageY)
        );
      }
    };

    this.mouseup = (event: Event) => {
      if (!this.enabled) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      this._state = STATE.NONE;
      document.removeEventListener("mousemove", this.mousemove);
      document.removeEventListener("mouseup", this.mouseup);
      this.dispatchEvent(END_EVENT);
    };

    this.mousewheel = (event: Event) => {
      if (!this.enabled) {
        return;
      }
      if (this.noZoom) return;
      const wheelEvent = event as WheelEvent;
      wheelEvent.preventDefault();
      wheelEvent.stopPropagation();
      switch (wheelEvent.deltaMode) {
        case 2:
          // Zoom in pages
          this._zoomStart.y -= wheelEvent.deltaY * 0.025;
          break;

        case 1:
          // Zoom in lines
          this._zoomStart.y -= wheelEvent.deltaY * 0.01;
          break;

        default:
          // undefined, 0, assume pixels
          this._zoomStart.y -= wheelEvent.deltaY * 0.00025;
          break;
      }
      this.dispatchEvent(START_EVENT);
      this.dispatchEvent(END_EVENT);
    };

    this.touchstart = (event: Event) => {
      if (!this.enabled) {
        return;
      }
      const touchEvent = event as TouchEvent;
      event.preventDefault();
      switch (touchEvent.touches.length) {
        case 1:
          this._state = STATE.TOUCH_ROTATE;
          this._moveCurr.copy(
            this.getMouseOnCircle(
              touchEvent.touches[0].pageX,
              touchEvent.touches[0].pageY
            )
          );
          this._movePrev.copy(this._moveCurr);
          break;
        default:
          // 2 or more
          this._state = STATE.TOUCH_ZOOM_PAN;
          const dx = touchEvent.touches[0].pageX - touchEvent.touches[1].pageX;
          const dy = touchEvent.touches[0].pageY - touchEvent.touches[1].pageY;
          this._touchZoomDistanceEnd = this._touchZoomDistanceStart = Math.sqrt(
            dx * dx + dy * dy
          );
          const x =
            (touchEvent.touches[0].pageX + touchEvent.touches[1].pageX) / 2;
          const y =
            (touchEvent.touches[0].pageY + touchEvent.touches[1].pageY) / 2;
          this._panStart.copy(this.getMouseOnScreen(x, y));
          this._panEnd.copy(this._panStart);
          break;
      }
      this.dispatchEvent(START_EVENT);
    };

    this.touchmove = (event: Event) => {
      if (!this.enabled) {
        return;
      }
      const touchEvent = event as TouchEvent;
      touchEvent.preventDefault();
      touchEvent.stopPropagation();

      switch (touchEvent.touches.length) {
        case 1:
          this._movePrev.copy(this._moveCurr);
          this._moveCurr.copy(
            this.getMouseOnCircle(
              touchEvent.touches[0].pageX,
              touchEvent.touches[0].pageY
            )
          );
          break;

        default:
          // 2 or more
          const dx = touchEvent.touches[0].pageX - touchEvent.touches[1].pageX;
          const dy = touchEvent.touches[0].pageY - touchEvent.touches[1].pageY;
          this._touchZoomDistanceEnd = Math.sqrt(dx * dx + dy * dy);
          const x =
            (touchEvent.touches[0].pageX + touchEvent.touches[1].pageX) / 2;
          const y =
            (touchEvent.touches[0].pageY + touchEvent.touches[1].pageY) / 2;
          this._panEnd.copy(this.getMouseOnScreen(x, y));
          break;
      }
    };

    this.touchend = (event: Event) => {
      if (!this.enabled) {
        return;
      }
      const touchEvent = event as TouchEvent;
      switch (touchEvent.touches.length) {
        case 0:
          this._state = STATE.NONE;
          break;

        case 1:
          this._state = STATE.TOUCH_ROTATE;
          this._moveCurr.copy(
            this.getMouseOnCircle(
              touchEvent.touches[0].pageX,
              touchEvent.touches[0].pageY
            )
          );
          this._movePrev.copy(this._moveCurr);
          break;
      }
      this.dispatchEvent(END_EVENT);
    };

    this.contextmenu = (event: Event) => {
      if (!this.enabled) {
        return;
      }
      event.preventDefault();
    };

    this.domElement.addEventListener("contextmenu", this.contextmenu, false);
    this.domElement.addEventListener("mousedown", this.mousedown, false);
    this.domElement.addEventListener("wheel", this.mousewheel, false);

    this.domElement.addEventListener("touchstart", this.touchstart, false);
    this.domElement.addEventListener("touchend", this.touchend, false);
    this.domElement.addEventListener("touchmove", this.touchmove, false);

    this.window.addEventListener("keydown", this.keydown, false);
    this.window.addEventListener("keyup", this.keyup, false);

    this.handleResize();

    // force an update at start
    this.update();
  }

  dispose(): void {
    this.domElement.removeEventListener("contextmenu", this.contextmenu, false);
    this.domElement.removeEventListener("mousedown", this.mousedown, false);
    this.domElement.removeEventListener("wheel", this.mousewheel, false);

    this.domElement.removeEventListener("touchstart", this.touchstart, false);
    this.domElement.removeEventListener("touchend", this.touchend, false);
    this.domElement.removeEventListener("touchmove", this.touchmove, false);

    document.removeEventListener("mousemove", this.mousemove, false);
    document.removeEventListener("mouseup", this.mouseup, false);

    this.window.removeEventListener("keydown", this.keydown, false);
    this.window.removeEventListener("keyup", this.keyup, false);
  }

  // ------------------------------------------------
  handleResize(): void {
    const box = this.domElement.getBoundingClientRect();
    // adjustments come from similar code in the jquery offset() function
    const d = this.domElement.ownerDocument!.documentElement;
    this.screen.left = box.left + this.window.pageXOffset - d.clientLeft;
    this.screen.top = box.top + this.window.pageYOffset - d.clientTop;
    this.screen.width = box.width;
    this.screen.height = box.height;
  }

  getMouseOnScreen = (pageX: number, pageY: number) => {
    const vector = new THREE.Vector2();
    return vector.set(
      (pageX - this.screen.left) / this.screen.width,
      (pageY - this.screen.top) / this.screen.height
    );
  };

  getMouseOnCircle = (pageX: number, pageY: number) => {
    const vector = new THREE.Vector2();
    return vector.set(
      (pageX - this.screen.width * 0.5 - this.screen.left) /
        (this.screen.width * 0.5),
      (this.screen.height + 2 * (this.screen.top - pageY)) / this.screen.width
    );
  };

  rotateCamera = () => {
    const axis: THREE.Vector3 = new THREE.Vector3();
    const quaternion: THREE.Quaternion = new THREE.Quaternion();
    const eyeDirection: THREE.Vector3 = new THREE.Vector3();
    const cameraUpDirection: THREE.Vector3 = new THREE.Vector3();
    const cameraSidewaysDirection: THREE.Vector3 = new THREE.Vector3();
    const moveDirection: THREE.Vector3 = new THREE.Vector3();
    let angle: number;

    moveDirection.set(
      this._moveCurr.x - this._movePrev.x,
      this._moveCurr.y - this._movePrev.y,
      0
    );
    angle = moveDirection.length();

    if (angle) {
      this._eye.copy(this.camera.position).sub(this.target);

      eyeDirection.copy(this._eye).normalize();
      cameraUpDirection.copy(this.camera.up).normalize();
      cameraSidewaysDirection
        .crossVectors(cameraUpDirection, eyeDirection)
        .normalize();

      cameraUpDirection.setLength(this._moveCurr.y - this._movePrev.y);
      cameraSidewaysDirection.setLength(this._moveCurr.x - this._movePrev.x);

      moveDirection.copy(cameraUpDirection.add(cameraSidewaysDirection));

      axis.crossVectors(moveDirection, this._eye).normalize();

      angle *= this.rotateSpeed;
      quaternion.setFromAxisAngle(axis, angle);

      this._eye.applyQuaternion(quaternion);
      this.camera.up.applyQuaternion(quaternion);

      this._lastAxis.copy(axis);
      this._lastAngle = angle;
    } else if (!this.staticMoving && this._lastAngle) {
      this._lastAngle *= Math.sqrt(1.0 - this.dynamicDampingFactor);
      this._eye.copy(this.camera.position).sub(this.target);
      quaternion.setFromAxisAngle(this._lastAxis, this._lastAngle);
      this._eye.applyQuaternion(quaternion);
      this.camera.up.applyQuaternion(quaternion);
    }
    this._movePrev.copy(this._moveCurr);
  };

  zoomCamera = () => {
    let factor: number;
    const { isPerspectiveCamera, isOrthographicCamera } = this.getCameraType();

    if (this._state === STATE.TOUCH_ZOOM_PAN) {
      factor = this._touchZoomDistanceStart / this._touchZoomDistanceEnd;
      this._touchZoomDistanceStart = this._touchZoomDistanceEnd;

      if (isPerspectiveCamera) {
        this._eye.multiplyScalar(factor);
      }
      if (isOrthographicCamera) {
        this.camera.zoom *= factor;
        this.camera.updateProjectionMatrix();
      }
      return;
    }
    factor = 1.0 + (this._zoomEnd.y - this._zoomStart.y) * this.zoomSpeed;

    if (factor !== 1.0 && factor > 0.0) {
      if (isPerspectiveCamera) {
        this._eye.multiplyScalar(factor);
      }
      if (isOrthographicCamera) {
        this.camera.zoom /= factor;
        this.camera.updateProjectionMatrix();
      }
    }

    if (this.staticMoving) {
      this._zoomStart.copy(this._zoomEnd);
    } else {
      this._zoomStart.y +=
        (this._zoomEnd.y - this._zoomStart.y) * this.dynamicDampingFactor;
    }
  };

  panCamera = () => {
    const mouseChange: THREE.Vector2 = new THREE.Vector2();
    const cameraUp: THREE.Vector3 = new THREE.Vector3();
    const pan: THREE.Vector3 = new THREE.Vector3();

    mouseChange.copy(this._panEnd).sub(this._panStart);
    const { isOrthographicCamera } = this.getCameraType();

    if (mouseChange.lengthSq()) {
      if (isOrthographicCamera) {
        const scale_x =
          ((this.camera as THREE.OrthographicCamera).right -
            (this.camera as THREE.OrthographicCamera).left) /
          this.camera.zoom /
          this.domElement.clientWidth;
        const scale_y =
          ((this.camera as THREE.OrthographicCamera).top -
            (this.camera as THREE.OrthographicCamera).bottom) /
          this.camera.zoom /
          this.domElement.clientWidth;
        mouseChange.x *= scale_x;
        mouseChange.y *= scale_y;
      }
      mouseChange.multiplyScalar(this._eye.length() * this.panSpeed);

      pan.copy(this._eye).cross(this.camera.up).setLength(mouseChange.x);
      pan.add(cameraUp.copy(this.camera.up).setLength(mouseChange.y));

      this.camera.position.add(pan);
      this.target.add(pan);

      if (this.staticMoving) {
        this._panStart.copy(this._panEnd);
      } else {
        this._panStart.add(
          mouseChange
            .subVectors(this._panEnd, this._panStart)
            .multiplyScalar(this.dynamicDampingFactor)
        );
      }
    }
  };

  checkDistances(): void {
    if (!this.noZoom || !this.noPan) {
      if (this._eye.lengthSq() > this.maxDistance * this.maxDistance) {
        this.camera.position.addVectors(
          this.target,
          this._eye.setLength(this.maxDistance)
        );
        this._zoomStart.copy(this._zoomEnd);
      }
      if (this._eye.lengthSq() < this.minDistance * this.minDistance) {
        this.camera.position.addVectors(
          this.target,
          this._eye.setLength(this.minDistance)
        );
        this._zoomStart.copy(this._zoomEnd);
      }
    }
  }

  update(): void {
    this._eye.subVectors(this.camera.position, this.target);
    if (!this.noRotate) {
      this.rotateCamera();
    }
    if (!this.noZoom) {
      this.zoomCamera();
    }
    if (!this.noPan) {
      this.panCamera();
    }
    this.camera.position.addVectors(this.target, this._eye);
    const { isPerspectiveCamera, isOrthographicCamera } = this.getCameraType();
    if (isPerspectiveCamera) {
      this.checkDistances();
      this.camera.lookAt(this.target);
      if (LAST_POSITION.distanceToSquared(this.camera.position) > EPS) {
        this.dispatchEvent(CHANGE_EVENT);
        LAST_POSITION.copy(this.camera.position);
      }
    }
    if (isOrthographicCamera) {
      this.camera.lookAt(this.target);
      if (
        LAST_POSITION.distanceToSquared(this.camera.position) > EPS ||
        LAST_ZOOM.value !== this.camera.zoom
      ) {
        this.dispatchEvent(CHANGE_EVENT);
        LAST_POSITION.copy(this.camera.position);
        LAST_ZOOM.value = this.camera.zoom;
      } else {
        console.warn("THREE.TrackballControls: Unsupported camera type");
      }
    }
  }

  reset(): void {
    this._state = STATE.NONE;
    this._keyState = STATE.NONE;
    this.target.copy(this.target0);
    this.camera.position.copy(this.position0);
    this.camera.up.copy(this.up0);
    this.camera.zoom = this.zoom0;
    this._eye.subVectors(this.camera.position, this.target);
    this.camera.lookAt(this.target);
    this.dispatchEvent(CHANGE_EVENT);
    LAST_POSITION.copy(this.camera.position);
    LAST_ZOOM.value = this.camera.zoom;
  }

  private getCameraType() {
    let isPerspectiveCamera = this.camera instanceof THREE.PerspectiveCamera;
    let isOrthographicCamera = this.camera instanceof THREE.OrthographicCamera;

    if (!isPerspectiveCamera && !isOrthographicCamera) {
      throw new Error(
        `THREE.TrackballControls: Unsupported camera type: ${typeof this
          .camera}`
      );
    }

    return { isPerspectiveCamera, isOrthographicCamera };
  }
}
