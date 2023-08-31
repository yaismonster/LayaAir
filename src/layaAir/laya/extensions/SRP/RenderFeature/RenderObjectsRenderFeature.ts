import { ILaya3D } from "../../../../ILaya3D";
import { CameraEventFlags } from "../../../d3/core/Camera";
import { RenderContext3D } from "../../../d3/core/render/RenderContext3D";
import { Scene3D } from "../../../d3/core/scene/Scene3D";
import { Stat } from "../../../utils/Stat";
import { RenderFeatureBase } from "../Runtime/RenderFeatureBase";
import { RenderPassBase } from "../Runtime/RenderPassBase";
import { RendererBase } from "../Runtime/RendererBase";

export class RenderObjectsRenderFeature extends RenderFeatureBase {

    private m_pass: RenderObjectsRenderPass;

    constructor(event: CameraEventFlags, isOpaque: boolean, cullingMask: number) {
        super(event);

        this.m_pass = new RenderObjectsRenderPass(event);
        this.m_pass.pipeLineModes = this.pipeLineModes;
        this.m_pass.isOpaque = isOpaque;
        this.m_pass.layerMask = cullingMask;
    }

    public AddRenderPasses(renderer: RendererBase): void {

        renderer.EnqueuePass(this.m_pass);
    }
}

export class RenderObjectsRenderPass extends RenderPassBase {

    //light modes
    pipeLineModes: string[];
    isOpaque: boolean;
    layerMask: number;

    constructor(event: CameraEventFlags) {
        super(event);
        this.passName = "render feature"
    }


    public Execute(context: RenderContext3D, scene: Scene3D, renderer: RendererBase): void {
        this.pipeLineModes.forEach(mode => {

            context.pipelineMode = mode;
            renderer._preCulling(context, this.isOpaque, scene, this.layerMask);

            if (this.isOpaque) {
                Stat.enableOpaque && renderer._drawRenderer(context, ILaya3D.Scene3D.SCENERENDERFLAG_RENDERQPAQUE);
            } else {
                Stat.enableTransparent && renderer._drawRenderer(context, ILaya3D.Scene3D.SCENERENDERFLAG_RENDERTRANSPARENT);
            }
        });
    }



}