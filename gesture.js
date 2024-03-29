// tap 点击
// pan 按住移动
// panstart 开始按住移动，startX, startY初始位置
// pan 移动中，dx,dy 距离startX,startY
// panend 按住移动结束， dx,dy 距离startX,startY
// flick 快速滑动
// press 手按，经过一段时间触发

class Gesture {
    constructor(main) {
        this.container = main;
        this.contexts = Object.create(null);
        this.mouseSymbol = Symbol("mouse");
        this._setup();
    }

    _setup() {
        this.mousedown = this.mousedown.bind(this);
        this.mousemove = this.mousemove.bind(this);
        this.mouseup = this.mouseup.bind(this);
        this.touchstart = this.touchstart.bind(this);
        this.touchmove = this.touchmove.bind(this);
        this.touchend = this.touchend.bind(this);
        this.touchcancel = this.touchcancel.bind(this);
    }

    _start(point, context) {
        // console.log("start", point.clientX, point.clientY);
        context.startX = point.clientX;
        context.startY = point.clientY;

        // tap
        context.isTap = true;
        // pan
        context.isPan = false;
        // flick
        context.isFlick = false;
        context.startTime = Date.now();

        // press
        context.isPress = false;
        context.pressHandler = setTimeout(() => {
            context.isPress = true;
            context.isTap = false;
            let e = new Event("pressstart");
            this.container.dispatchEvent(e);
            context.pressHandler = null;
        }, 2000);
    }

    _move(point, context) {
        let dx = point.clientX - context.startX,
            dy = point.clientY - context.startY;

        if (dx * dx + dy * dy > 100) {
            // tap
            context.isTap = false;

            // press
            if (context.pressHandler !== null) {
                // 是在press了,但延迟时间还没有到的时候，移动了情况
                clearTimeout(context.pressHandler);
                context.pressHandler = null;
                context.isPress = false;
            } else if (context.isPress) {
                // 是在press了,但延迟时间到的时候，移动了情况
                context.isPress = false;
                let e = new Event("presscancel");
                this.container.dispatchEvent(e);
            }

            // pan
            if (context.isPan == false) {
                if (Math.abs(dx) > Math.abs(dy)) {
                    context.isVertical = false;
                    context.isHorizontal = true;
                } else {
                    context.isVertical = true;
                    context.isHorizontal = false;
                }

                let e = new Event("panstart");
                e.startX = context.startX;
                e.startY = context.startY;
                this.container.dispatchEvent(e);
                context.isPan = true;
            }
        }

        if (context.isPan) {
            let e = new Event("pan");
            e.dx = dx;
            e.dy = dy;
            e.isHorizontal = context.isHorizontal;
            e.isVertical = context.isVertical;
            this.container.dispatchEvent(e);
        }
    }

    _end(point, context) {
        // press
        if (context.pressHandler !== null) {
            clearTimeout(context.pressHandler);
        }
        if (context.isPress) {
            let e = new Event("pressend");
            this.container.dispatchEvent(e);
        }
        // tap
        if (context.isTap) {
            let e = new Event("tap");
            console.log("this.container", this.container.dispatchEvent(e));
            this.container.dispatchEvent(e);
        }

        // flick
        let dx = point.clientX - context.startX,
            dy = point.clientY - context.startY;

        let v = Math.sqrt(dx * dx + dy * dy) / (Date.now() - context.startTime);
        if (context.isPan && v > 0.3) {
            context.isFlick = true;
            let e = new Event("flick");
            e.dx = dx;
            e.dy = dy;
            this.container.dispatchEvent(e);
        }

        // pan
        if (context.isPan) {
            let e = new Event("panend");
            e.dx = dx;
            e.dy = dy;
            e.isFlick = context.isFlick;
            e.isHorizontal = context.isHorizontal;
            e.isVertical = context.isVertical;
            this.container.dispatchEvent(e);
        }
    }

    _cancel(point, context) {
        if (context.isPan) {
            let e = new Event("pancancel");
            this.container.dispatchEvent(e);
        }
        if (context.isPress) {
            let e = new Event("presscancel");
            this.container.dispatchEvent(e);
        }
        if (context.pressHandler !== null) {
            let e = new Event("pancancel");
            this.container.dispatchEvent(e);
            clearTimeout(context.pressHandler);
        }
    }

    // mouse 事件
    mousedown(event) {
        document.addEventListener("mousemove", this.mousemove);
        document.addEventListener("mouseup", this.mouseup);
        this.contexts[this.mouseSymbol] = Object.create(null);
        this._start(event, this.contexts[this.mouseSymbol]);
    }

    mousemove(event) {
        this._move(event, this.contexts[this.mouseSymbol]);
    }

    mouseup(event) {
        document.removeEventListener("mousemove", this.mousemove);
        document.removeEventListener("mouseup", this.mouseup);
        this._end(event, this.contexts[this.mouseSymbol]);
        delete this.contexts[this.mouseSymbol];
    }

    // 手势事件
    touchstart(event) {
        for (let touch of event.changedTouches) {
            this.contexts[touch.identifier] = Object.create(null);
            this._start(touch, this.contexts[touch.identifier]);
        }
    }

    touchmove(event) {
        for (let touch of event.changedTouches) {
            this._move(touch, this.contexts[touch.identifier]);
        }
    }

    touchend(event) {
        for (let touch of event.changedTouches) {
            this._end(touch, this.contexts[touch.identifier]);
            delete this.contexts[touch.identifier];
        }
    }

    touchcancel(event) {
        for (let touch of event.changedTouches) {
            this._end(touch, this.contexts[touch.identifier]);
            delete this.contexts[touch.identifier];
        }
    }
}

const enableGesture = main => {
    const gesture = new Gesture(main);
    // mouse事件
    main.addEventListener("mousedown", gesture.mousedown);

    // 手势事件
    main.addEventListener("touchstart", gesture.touchstart);
    main.addEventListener("touchmove", gesture.touchmove);
    main.addEventListener("touchend", gesture.touchend);
    main.addEventListener("touchcancel", gesture.touchcancel);
};
