import { RenderClearFlag } from "../../../RenderEngine/RenderEnum/RenderClearFlag";
import { RenderTargetFormat } from "../../../RenderEngine/RenderEnum/RenderTargetFormat";
import { PipelineMode } from "../../../RenderEngine/RenderInterface/RenderPipelineInterface/IRenderContext3D";
import { Camera, CameraEventFlags } from "../../../d3/core/Camera";
import { RenderContext3D } from "../../../d3/core/render/RenderContext3D";
import { Scene3D } from "../../../d3/core/scene/Scene3D";
import { Color } from "../../../maths/Color";
import { Render } from "../../../renders/Render";
import { RenderTexture } from "../../../resource/RenderTexture";
import { RendererBase } from "./RendererBase";

export abstract class RenderPassBase{
    
    constructor(event:CameraEventFlags){
        this.renderPassEvent = event;
        this.clearFlag = RenderClearFlag.Color|RenderClearFlag.Depth|RenderClearFlag.Stencil;
        this.m_ClearColor = Color.BLACK;
        // this.colorRenderTarget = RenderTexture.createFromPool(100,100,RenderTargetFormat.R8G8B8A8,RenderTargetFormat.DEPTHSTENCIL_24_8,false,1);
    }

    public renderPassEvent:CameraEventFlags;

    public colorRenderTarget : RenderTexture;
    
    public clearFlag :RenderClearFlag;

    private m_ClearColor : Color;

    public pipelineMode : Array<PipelineMode>;

    public passName : string;

    public get ClearColor():Color{
        return this.m_ClearColor;
    }

    public abstract Execute(context:RenderContext3D,scene:Scene3D,renderer:RendererBase):void;

}