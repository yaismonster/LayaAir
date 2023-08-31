import { ILaya3D } from "../../../../ILaya3D";
import { PipelineMode } from "../../../RenderEngine/RenderInterface/RenderPipelineInterface/IRenderContext3D";
import { CameraEventFlags } from "../../../d3/core/Camera";
import { RenderContext3D } from "../../../d3/core/render/RenderContext3D";
import { Scene3D } from "../../../d3/core/scene/Scene3D";
import { RenderPassBase } from "../Runtime/RenderPassBase";
import { RendererBase } from "../Runtime/RendererBase";

export class DrawSkyBoxPass extends RenderPassBase{

    constructor(event:CameraEventFlags){
        super(event);
        this.pipelineMode = ["Forward"]
        this.renderPassEvent = event;
        this.passName = "skybox"
    }

    public Execute(context: RenderContext3D, scene: Scene3D,renderer:RendererBase): void {
        // renderer.recoverRenderContext3D(context,renderer.activeRenderTarget);
        this.pipelineMode.forEach(mode => {
            context.pipelineMode = mode;
            //TODO.
            scene._renderScene(context,ILaya3D.Scene3D.SCENERENDERFLAG_SKYBOX);
        })
    }

}