import { RenderContext3D } from "../../../d3/core/render/RenderContext3D";
import { Scene3D } from "../../../d3/core/scene/Scene3D";
import { RenderPassBase } from "../Runtime/RenderPassBase";
import { RendererBase } from "../Runtime/RendererBase";

export class DrawDepthPass extends RenderPassBase{
    public Execute(context: RenderContext3D, scene: Scene3D, renderer: RendererBase): void {
        renderer.currentCamera._renderDepthMode(context);
    }

}