import React, { Component } from 'react'
import "../css/GateSpace.css"
import { ConnectorIn, ConnectorOut } from './Connector';
import { CNT_IN_POS, NAME, CNT_OUT_POS, DIM, CONNECTOR } from "../Constants";

export class Gate extends Component {
    constructor(props){
        super(props);
        this.state = {
            logic_type: props.logicType,
            parent: props.parent,
            id: props.id,
            x: props.x,
            y: props.y,
            dx: 0,
            dy: 0,
            dragging: false,
            // dragErr: false,
            in: [],
            out: [],
            cntIn: {},
            cntOut: {},
            calc: this.calc.bind(this),
        };
        this.dragStart = this.dragStart.bind(this);
        this.dragMid = this.dragMid.bind(this);
        this.dragEnd = this.dragEnd.bind(this);
        // this.dragFail = this.dragFail.bind(this);
        // this.dragFix = this.dragFix.bind(this);
        this.deleteGate = this.deleteGate.bind(this);
        // console.log(this.state.id, this.state.logic_type);
    }
    calc(){
        var outList = [];
        if(this.state.logic_type==="AND")outList.push(this.state.in[0] && this.state.in[1]);
        else if(this.state.logic_type==="NAND")outList.push(!(this.state.in[0] && this.state.in[1]));
        else if(this.state.logic_type==="OR")outList.push(this.state.in[0] || this.state.in[1]);
        else if(this.state.logic_type==="NOR")outList.push(!(this.state.in[0] || this.state.in[1]));
        else if(this.state.logic_type==="XOR")outList.push(this.state.in[0] ^ this.state.in[1]);
        else if(this.state.logic_type==="XNOR")outList.push(!(this.state.in[0] ^ this.state.in[1]));
        else if(this.state.logic_type==="NOT")outList.push(!this.state.in[0]);
        else if(this.state.logic_type==="BUFFER")outList.push(this.state.in[0]);
        else if(this.state.logic_type==="SR Flip Flop"){
            // Q = !CLK&&Q||CLK&&S||!R&&Q
            outList.push(
                (!this.state.in[3]&& this.state.out[0]) || 
                (this.state.in[3]&&this.state.in[0]) || 
                (!this.state.in[1]&&this.state.out[0])
            );
            outList.push(!this.state.out[0]);/// TODO calc
        }else if(this.state.logic_type==="D Flip Flop"){
            //Q = !CLK&&Q||CLK&&D
            outList.push(
                (!this.state.in[1]&&this.state.out[0])||
                (this.state.in[1]&&this.state.in[0])
            );
            outList.push(!this.state.out[0]);
        }else if(this.state.logic_type==="JK Flip Flop"){
            //Q = !(K&&CLK)&&Q||CLK&&J&&!Q
            outList.push(
                (!(this.state.in[1]&&this.state.in[3])&&this.state.out[0])||
                (this.state.in[3]&&this.state.in[0]&&!this.state.out[0])
            );
            outList.push(!this.state.out[0]);
        }else if(this.state.logic_type==="T Flip Flop"){
            //Q = !(T&&CLK)&&Q||CLK&&T&&!Q
            outList.push(
                (!(this.state.in[0]&&this.state.in[1])&&this.state.out[0])||
                (this.state.in[1]&&this.state.in[0]&&!this.state.out[0])
            );
            outList.push(!this.state.out[0]);
        }
        this.setState({out:outList});
    }

    dragStart(e){
        var dx = e.clientX - e.currentTarget.getBoundingClientRect().left;
        var dy = e.clientY - e.currentTarget.getBoundingClientRect().top;
        var dxx = e.currentTarget.getBoundingClientRect().right-e.clientX;
        var dyy = e.currentTarget.getBoundingClientRect().bottom-e.clientY;
        if(dy<=25||dyy<=25||dx<=25||dxx<=25)return;
        var z = this.state.parent.state.zdx;
        z[z.indexOf(this.state.id)] = z[z.length-1];
        z[z.length-1] = this.state.id;
        this.state.parent.setState({zdx:z});
        this.setState({
            dragging: true,
            // dragErr: false,
            dx: dx,
            dy: dy,
        });
    }
    dragMid(e){
        if(!this.state.dragging)return;
        var lft = e.clientX - this.state.dx;
        var top = e.clientY - this.state.dy;
        this.setState({
            x: lft,
            y: top,
        });
        for (let i in this.state.cntIn){
            if(this.state.cntIn[i].state.line)
                this.state.cntIn[i].state.line.setState({to:{
                    x:lft, 
                    y:top+CNT_IN_POS[this.state.logic_type][i].y+CONNECTOR.h/2
                }});
        }
        for (let inNode in this.state.cntOut){
            var lines = this.state.cntOut[inNode].state.lines;
            if(!lines)continue;
            for (let lneNo in lines){
                lines[lneNo].setState({frm:{
                    x:lft+DIM[this.state.logic_type].w,
                    y:top+CNT_OUT_POS[this.state.logic_type][inNode].y+CONNECTOR.h/2
                }});
            }
        }
    }
    dragEnd(e){
        this.setState({
            dragging: false,
            // dragErr: false,
        });
    }
    // dragFail(e){
    //     if(!this.state.dragging)return;
    //     var lft = e.clientX - this.state.dx;
    //     var top = e.clientY - this.state.dy;
    //     console.log("BINGO", lft, top);
    //     this.setState({
    //         x: lft,
    //         y: top,
    //         dragErr: true,
    //     });
    // }
    // dragFix(e){
    //     if(!this.state.dragging)return;
    //     if(!this.state.dragErr)return;
    //     this.setState({ dragErr: false });
    // }
    deleteGate(e){
        if(!(("which" in e && e.which === 3) || ("button" in e && e.button === 2)))return;
        var gateSpace = this.state.parent
        var gates = gateSpace.state.gates;

        for (let i in this.state.cntIn){
            if(this.state.cntIn[i].state.line)
            this.state.cntIn[i].state.line.deleteLine(this.state.id);
        }
        for (let inNode in this.state.cntOut){
            var lines = this.state.cntOut[inNode].state.lines;
            if(!lines)continue;
            for (let lneNo in lines)
            lines[lneNo].deleteLine(this.state.id);
        }
        delete gates[this.state.id];
        this.state.parent.setState({gates: gates});

        e.preventDefault();
    }
    render() {
        var style = {
            left: this.state.x,
            top: this.state.y,
            zIndex: this.state.parent.state.zdx.indexOf(this.state.id),
        }
        return (
            <div className='Gate' style={style}
            onMouseLeave={this.dragFail}
            onMouseEnter={this.dragFix}
            onMouseDown={this.dragStart} 
            onMouseMove={this.dragMid} 
            onMouseUp={this.dragEnd}
            onContextMenu={this.deleteGate}
            >
                <img width={DIM[this.state.logic_type].w} height={DIM[this.state.logic_type].h}
                src={require(`../res/${NAME[this.state.logic_type]}.png`)}
                alt={NAME[this.state.logic_type]}/>
                {CNT_IN_POS[this.state.logic_type].map(
                    (l_type, i)=><ConnectorIn gate={this} x={l_type.x} y={l_type.y} key={i} id={i} gateSpace={this.state.parent}/>
                )}                
                {CNT_OUT_POS[this.state.logic_type].map(
                    (l_type, i)=><ConnectorOut gate={this} x={l_type.x} y={l_type.y} key={i} id={i} gateSpace={this.state.parent}/>
                )}                
            </div>
        )
    }
}

export default Gate