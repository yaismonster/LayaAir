import { PipelineMode } from "../../../RenderEngine/RenderInterface/RenderPipelineInterface/IRenderContext3D";
import { Script } from "../../../components/Script";
import { CameraEventFlags } from "../../../d3/core/Camera";
import { RendererBase } from "./RendererBase";

export abstract class RenderFeatureBase {

    event: CameraEventFlags = CameraEventFlags.BeforeForwardOpaque - 1;
    //light modes
    pipeLineModes: Array<PipelineMode>;

    m_Active: boolean = true;

    public get isActive(): boolean {
        return this.m_Active;
    }
    constructor(event:CameraEventFlags) {
        this.pipeLineModes = new Array<PipelineMode>;
        this.event = event;
    }

    // public OnCameraPreCull(): void { }

    public abstract AddRenderPasses(renderer: RendererBase): void;

    public SetPipelineModes(...params: string[]) {
        this.pipeLineModes.push(...params);
    }

    // protected SupportsNativeRenderPass():boolean
    // {
    //     return false;
    // }



    // public SetActive(active:boolean):void {
    //     this.m_Active = active;
    // }

    // public Dispose(disposing?:boolean):void{
    //     if(disposing){

    //     }
    // }
}