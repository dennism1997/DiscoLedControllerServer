import React from 'react';
import "./HueSlider.scss";
import Draggable, {DraggableData, DraggableEvent} from 'react-draggable';

interface Props {
    value: number,
    onChangeHue: (hue: number, debounced: boolean) => void
}

interface State {
    handleColor: string
    posX: number
}

class HueSlider extends React.Component<Props, State> {

    constructor(props: Props, context: any) {
        super(props, context);
        this.state = {
            handleColor: `hsl(${(this.props.value/255) * 360}, 100%, 50%)`,
            posX: this.props.value
        }
    }

    private handleRef = React.createRef<HTMLDivElement>();


    handleDrag = (e: DraggableEvent, d: DraggableData) => {
        if (this.handleRef.current !== null) {
            let angle = (d.x / this.handleRef.current.parentElement!!.clientWidth) * 360;
            this.setState({
                handleColor: `hsl(${angle}, 100%, 50%)`,
            })
            this.props.onChangeHue(angle, true);
        }
    };

    handleDragForce = (e: DraggableEvent, d: DraggableData) => {
        console.log("force")
        if (this.handleRef.current !== null) {
            let angle = (d.x / this.handleRef.current.parentElement!!.clientWidth) * 360;
            this.setState({
                handleColor: `hsl(${angle}, 100%, 50%)`,
                posX: d.x
            })
            this.props.onChangeHue(angle, false);
        }
    };


    componentDidMount() {
        this.setState({
            posX: (this.props.value / 256) * this.handleRef.current!!.parentElement!!.clientWidth
        })
    }

    render() {
        return <div className={"slider grad"}>
            <Draggable
                axis={"x"}
                handle={".handle"}
                position={{x: this.state.posX, y: 0}}
                defaultPosition={{x: this.props.value, y: 0}}
                bounds={"parent"}
                grid={[1, 1]}
                onDrag={this.handleDrag}
                onStop={this.handleDragForce}
                defaultClassName={"handle"}
                defaultClassNameDragging={"handle pop"}
            >
                <div ref={this.handleRef}
                     style={{
                         background: this.state.handleColor
                     }}/>
            </Draggable>
        </div>

    }
}

export default HueSlider