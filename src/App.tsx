import React from 'react';
import './App.scss';
import {ColorMode, LedMode, WebSocketController, WebSocketMessage} from "./WebSocketController";
import {$enum} from "ts-enum-util";
import HueSlider from "./HueSlider";
import {Button, Input, Slider} from "@material-ui/core";
import Select from 'react-select'

declare global {
    // noinspection JSUnusedGlobalSymbols
    interface Number {
        clamp8(): number;
    }
}
// eslint-disable-next-line no-extend-native
Number.prototype.clamp8 = function (): number {
    return Math.max(0, Math.min(255, Math.round(this as number)));
}

// const palettes = [
//     ["Sunset", "palettes/Sunset_Real.png"],
//     ["Sunconure", "palettes/bhw1_sunconure.png"],
// ];

const paletteOptions = [
    { value: 'Sunset', label: <img alt={"Sunset"} src={"palettes/Sunset_Real.png"} height="100%" width="100%"/> },
    { value: 'Sunconure', label: <img alt={"Sunconure"} src={"palettes/bhw1_sunconure.png"} height="100%" width="100%"/> },
]

interface Props {

}

interface State {
    notification: string;
    errorNotification: string;
    rgbStrings: string[];
    settings: WebSocketMessage;
}


class App extends React.Component<Props, State> {
    private webSocketController: WebSocketController

    private modeOptionRef: React.Ref<HTMLInputElement> = React.createRef();


    constructor(props: Readonly<Props> | Props) {
        super(props);
        this.state = {
            notification: "",
            errorNotification: "",
            rgbStrings: [],
            settings: {
                ledMode: LedMode.Rain,
                modeOption: 0,
                bpm: 120,
                brightness: 255,
                intensity: 0,
                h: 0,
                h2: 0,
                colorMode: ColorMode.Single,
                paletteIndex: 0,
            }
        };

        this.webSocketController = new WebSocketController(
            e => {
                console.error(e)
                this.setState({
                    errorNotification: e
                }, () => {
                    setTimeout(() => {
                        this.setState({
                            errorNotification: ""
                        })
                    }, 3000)
                });
            },
            () => {
                this.setState({
                    notification: "connected"
                });
            },
            event => {
                let s = event.data.toString();
                console.log(s);
                if (s.includes("#")) {
                    let a = [];
                    for (let i = 0; i < s.length; i += 7) {
                        let rgbString = s.substr(i, 7);
                        a.push(rgbString);
                    }
                    this.setState({
                        rgbStrings: a
                    })
                } else {
                    let dataValues = s.split(",").map((d: string) => {
                        return parseInt(d).clamp8();
                    });

                    this.setState({
                        settings: {
                            ledMode: dataValues[0],
                            modeOption: dataValues[1],
                            bpm: dataValues[2],
                            brightness: dataValues[3],
                            intensity: dataValues[4],
                            h: dataValues[5],
                            h2: dataValues[6],
                            colorMode: dataValues[7],
                            paletteIndex: dataValues[8],
                        }
                    })
                }
            });

    }


    componentDidMount() {
        this.webSocketController.connect();
    }

    changeAndSendSettings(newMessage: Partial<WebSocketMessage>, debounce: boolean = false) {
        let m = {...this.state.settings, ...newMessage}
        this.webSocketController.sendSettings(m, debounce);
        this.setState({
            settings: m
        });
    }

    /**
     *
     * @param hue between 0 and 360
     * @param debounce send
     */
    public changeHue(hue: number, debounce: boolean = false) {
        let h = (256 * (255 * hue / 360) / 236).clamp8();
        let m = {...this.state.settings, h: h}
        this.webSocketController.sendSettings(m, debounce);
        this.setState({
            settings: m
        });
    }

    /**
     *
     * @param hue between 0 and 360
     * @param force send
     */
    public changeHue2(hue: number, force: boolean = false) {
        let h = Math.round(255 * (255 * hue / 360) / 236);
        let m = {...this.state.settings, h2: h}
        this.webSocketController.sendSettings(m, force);
        this.setState({
            settings: m
        });
    }

    getModeOptionHelpText(): string[] {
        switch (this.state.settings.ledMode) {
            case LedMode.Rain:
                return ["0-2 forward, 3-4 backwards, >5 random"];
            case LedMode.Strobe:
                return ["0 for fixed pattern, 1 for random, 2 for forward, 3 for backwards"];
            case LedMode.Cylon:
                return ["ModeOption determines the 'width' of the eye"];
            case LedMode.Sparkle:
                return ["0 for one at a time, 1 for fill to whole"]
            case LedMode.Flash:
                return ["determines the time the leds are on"];
            case LedMode.Wave:
                return ["0, 1 or 2 for sine wave. 3, 4 or 5 for sawtooth wave", "6, 7 or 8 for inverse sawtooth wave. 9 for triangle wave"]
            default:
                return [];
        }
    }


    render() {
        return <section className={"section pt-5"}>
            <div className={"container"}>

                <h4 className={"title is-5 mb-1"}>Presets:</h4>
                <div className={"columns"}>
                    <div className={"column is-two-fifths-tablet is-full-mobile"}>
                        <div className={"level mt-1"}>
                            {Object.entries(this.getPresets()).map(([key, settings], index) => {
                                return <Button className={"m-1"} variant={"outlined"} key={index}
                                               onClick={() => {
                                                   this.changeAndSendSettings(settings)
                                               }}>{key}
                                </Button>
                            })}
                        </div>
                    </div>
                </div>

                <h4 className={"title is-5 mb-1"}>Led Mode:</h4>
                <div className={"columns"}>
                    <div className={"column is-two-fifths-tablet is-full-mobile"}>
                        <div className={"level mt-1"}>
                            {$enum(LedMode).getKeys().map((k, index) => {
                                let color = this.state.settings.ledMode === LedMode[k] ? "primary" : "default";
                                // @ts-ignore
                                return <Button className={"m-1"} variant={"outlined"} key={index} color={color}
                                               onClick={() => {
                                                   this.changeAndSendSettings({
                                                       ledMode: LedMode[k]
                                                   })
                                               }}>{k}
                                </Button>
                            })}
                        </div>
                    </div>
                </div>
                <h4 className={"title is-6 mt-2 mb-2"}>Led Mode Option:</h4>
                <div className={"columns"}>
                    <div className={"column is-two-thirds-tablet is-full-mobile"}>
                        {this.getModeOptionHelpText().map((s, i) => {
                            return <p className={"is-size-6"} key={i}>{s}</p>
                        })}
                    </div>
                </div>
                <div className={"columns"}>
                    <div className={"column is-one-quarter-tablet is-four-fifths-mobile pt-0"}>
                        <input className={"input"} ref={this.modeOptionRef} type={"number"} min={0}
                               defaultValue={this.state.settings.ledMode}
                               step={1}
                               max={255}
                               onChange={e => {
                                   this.changeAndSendSettings({
                                       modeOption: parseInt(e.currentTarget.value)
                                   })
                               }}
                        />
                    </div>
                </div>

                <h4 className={"title is-5 mt-2 mb-2"}>BPM:</h4>
                <div className={"columns"}>
                    <div className={"column is-one-quarter-tablet is-four-fifths-mobile"}>
                        <Slider min={90} max={140} step={1}
                                value={this.state.settings.bpm}
                                valueLabelDisplay={"auto"}
                                onChange={(_, bpm) => {
                                    this.changeAndSendSettings({
                                        bpm: Math.round(bpm as number)
                                    }, true)
                                }}
                                onChangeCommitted={(_, bpm) => {
                                    this.changeAndSendSettings({
                                        bpm: Math.round(bpm as number)
                                    })
                                }}/>
                    </div>

                    <div className={"column"}>
                        <Input value={this.state.settings.bpm} margin="dense"
                               onChange={(e) => {
                                   let bpm = parseInt(e.currentTarget.value).clamp8();
                                   if (bpm >= 90 && bpm <= 140) {
                                       this.changeAndSendSettings({
                                           bpm: bpm
                                       })
                                   }
                               }}
                               inputProps={{
                                   step: 1,
                                   min: 90,
                                   max: 140,
                                   type: 'number',
                               }}
                        />
                    </div>

                </div>

                <h4 className={"title is-5 mb-1"}>Color Mode:</h4>
                <div className={"columns"}>
                    <div className={"column is-two-fifths-tablet is-full-mobile"}>
                        <div className={"level mt-1"}>
                            {$enum(ColorMode).getKeys().map((k, index) => {
                                let color = this.state.settings.colorMode === ColorMode[k] ? "primary" : "default";
                                // @ts-ignore
                                return <Button className={"m-1"} variant={"outlined"} key={index} color={color}
                                               onClick={() => {
                                                   this.changeAndSendSettings({
                                                       colorMode: ColorMode[k]
                                                   })

                                               }}>{k}
                                </Button>
                            })}
                        </div>
                    </div>
                </div>

                <h4 className={"title is-5 mt-2 mb-2"}>Color:</h4>
                <div className={"columns mt-2"}>
                    <div className={"column is-three-fifths-tablet is-one-third-desktop is-full--mobile"}>
                        <HueSlider value={this.state.settings.h} onChangeHue={(hue, debounced) => {
                            this.changeHue(hue, debounced);
                        }}/>
                    </div>
                </div>

                {[ColorMode.Duo].includes(this.state.settings.colorMode) ?
                    <>
                        <h4 className={"title is-5 mt-2 mb-2"}>Color 2:</h4>
                        <div className={"columns mt-2"}>
                            <div className={"column is-three-fifths-tablet is-one-third-desktop is-full--mobile"}>
                                <HueSlider value={this.state.settings.h2} onChangeHue={(hue, debounced) => {
                                    this.changeHue2(hue, debounced);
                                }}/>
                            </div>
                        </div>
                    </> : null
                }

                {this.state.settings.colorMode === ColorMode.Palette ?
                    <>
                        <h4 className={"title is-5 mt-2 mb-2"}>Palette:</h4>
                        <div className={"columns mt-2"}>
                            <div className={"column is-three-fifths-tablet is-one-third-desktop is-full--mobile"}>
                               <Select value={paletteOptions[this.state.settings.paletteIndex]} options={paletteOptions}
                                       onChange={(newValue) => {
                                           let paletteIndex = paletteOptions.findIndex(e => {
                                               return e.value === newValue!!.value;
                                           });
                                           this.changeAndSendSettings({
                                               paletteIndex: paletteIndex
                                           })
                                       }}
                               />
                            </div>
                        </div>
                    </> : null
                }

                <h4 className={"title is-5 mt-2 mb-2"}>Intensity:</h4>
                <div className={"columns"}>
                    <div className={"column is-three-fifths-tablet is-one-third-desktop is-full-mobile px-4"}>
                        <Slider min={0} max={8} step={1} valueLabelDisplay={"auto"} marks
                                value={this.state.settings.intensity}
                                defaultValue={0}
                                onChange={(_, intensity) => {
                                    this.changeAndSendSettings({
                                        intensity: Math.round(intensity as number)
                                    }, true)
                                }}
                                onChangeCommitted={(_, brightness) => {
                                    this.changeAndSendSettings({
                                        intensity: Math.round(brightness as number)
                                    })
                                }}/>
                    </div>
                </div>

                <h4 className={"title is-5 mt-2 mb-2"}>Brightness:</h4>
                <div className={"columns"}>
                    <div className={"column is-three-fifths-tablet is-one-third-desktop is-full-mobile px-4"}>
                        <Slider min={0} max={255} step={1}
                                value={this.state.settings.brightness}
                                valueLabelDisplay={"auto"}
                                onChange={(_, brightness) => {
                                    this.changeAndSendSettings({
                                        brightness: (brightness as number).clamp8()
                                    }, true)

                                }}
                                onChangeCommitted={(_, brightness) => {
                                    this.changeAndSendSettings({
                                        brightness: (brightness as number).clamp8()
                                    })
                                }}/>
                    </div>
                </div>

                <Button variant={"contained"} color={"primary"} onClick={_ => {
                    this.webSocketController.sendSettings(this.state.settings, false);
                }}>Send
                </Button>


                <div className={"columns mt-3"}>
                    <div className={"column is-two-thirds-tablet"}>
                        <div className={"level"}>
                            {this.state.rgbStrings.map((rgbString, i) => {
                                return <div className={"led-box"} key={i} style={{
                                    backgroundColor: rgbString
                                }}/>
                            })}
                        </div>
                    </div>
                </div>
                {this.state.notification !== null && this.state.notification.length > 0}
                <p>Message: <span>{this.state.notification}</span></p>
                <p>Error Message: <span>{this.state.errorNotification}</span></p>
            </div>
        </section>;
    }

    getPresets(): { [key: string]: Partial<WebSocketMessage> } {
        return {
            "Cyan Drop": {
                ledMode: LedMode.Flash,
                modeOption: 0,
                intensity: 2,
                colorMode: ColorMode.Single,
                h: 128
            },
            "Red Drop": {
                ledMode: LedMode.Flash,
                modeOption: 0,
                intensity: 2,
                colorMode: ColorMode.Single,
                h: 0,
            },

        }
    }
}

export default App;
