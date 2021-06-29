export enum LedMode {
    Rain, Strobe, Cylon, Sparkle, Flash, Wave
}

export enum ColorMode {
    Single, Complement, RainbowFade, RainbowSplash, Duo, Palette, Close
}

export interface WebSocketMessage {
    ledMode: LedMode
    modeOption: number
    bpm: number
    brightness: number
    intensity: number
    h: number
    h2: number
    colorMode: ColorMode
    paletteIndex: number
}

declare global {
    interface Window {
        socketTimerId: number
    }
}


export class WebSocketController {
    private readonly ip = "ws://192.168.178.200:80";
    private socket?: WebSocket
    private lastSent: number = Date.now()
    private readonly onErrorCallback: (e: string) => void;
    private readonly onOpenCallback: (e: Event) => void;
    private readonly onMessageCallback: (e: MessageEvent) => void;


    constructor(onErrorCallback: (e: string) => void, onOpenCallback: (e: Event) => void, onMessageCallback: (e: MessageEvent) => void) {
        this.onErrorCallback = onErrorCallback;
        this.onOpenCallback = onOpenCallback;
        this.onMessageCallback = onMessageCallback;

        if (!window.socketTimerId) {
            // @ts-ignore
            window.socketTimerId = setInterval(this.connect.bind(this), 5000);
        }
    }

    public connect() {
        this.socket = new WebSocket(this.ip);
        this.socket.onclose = e => {
            this.onErrorCallback(`Socket closed`);
            if (!window.socketTimerId) {
                // @ts-ignore
                window.socketTimerId = setInterval(this.connect.bind(this), 5000);
            }
        }
        this.socket.onopen = e => {
            if (window.socketTimerId) {
                window.clearInterval(window.socketTimerId)
                window.socketTimerId = 0;
            }
            this.onOpenCallback(e);
        }
        this.socket.onmessage = e => {
            this.onMessageCallback(e);
        }
        this.socket.onerror = e => {
            this.onErrorCallback(e.toString());
        }
    }



    public sendSettings(message: WebSocketMessage, debounced: boolean) {
        if (!debounced || Date.now() - this.lastSent >= 400) {
            this.lastSent = Date.now()
            let s = Object.values(message).map(value => value.clamp8()).join(",");

            if (this.socket?.readyState !== WebSocket.OPEN) {
                this.onErrorCallback("Websocket is not open");
                console.log("Attempted to send: " + s);
                return;
            }
            this.socket.send(s)
            console.log(`sent: ${s}`)
        }
    }
}

// function rgbToHsv(r: number, g: number, b: number) {
//     r /= 255;
//     g /= 255;
//     b /= 255;
//
//     let max = Math.max(r, g, b), min = Math.min(r, g, b);
//     let h = 0, s = 0, l = (max + min) / 2;
//
//     if (max === min) {
//         h = s = 0; // achromatic
//     } else {
//         let d = max - min;
//         s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
//
//         switch (max) {
//             case r:
//                 h = (g - b) / d + (g < b ? 6 : 0);
//                 break;
//             case g:
//                 h = (b - r) / d + 2;
//                 break;
//             case b:
//                 h = (r - g) / d + 4;
//                 break;
//         }
//
//         h /= 6;
//     }
//
//     return [Math.floor(h * 256), Math.floor(s * 256), Math.floor(l * 256)];
// }