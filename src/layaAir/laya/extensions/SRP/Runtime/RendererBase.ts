import { Config3D } from "../../../../Config3D";
import { ICameraCullInfo } from "../../../RenderEngine/RenderInterface/RenderPipelineInterface/ICameraCullInfo";
import { IRenderQueue } from "../../../RenderEngine/RenderInterface/RenderPipelineInterface/IRenderQueue";
import { Camera, CameraClearFlags, CameraData, CameraEventFlags } from "../../../d3/core/Camera";
import { RenderContext3D } from "../../../d3/core/render/RenderContext3D";
import { RenderElement } from "../../../d3/core/render/RenderElement";
import { CommandBuffer } from "../../../d3/core/render/command/CommandBuffer";
import { Scene3D } from "../../../d3/core/scene/Scene3D";
import { FrustumCulling } from "../../../d3/graphics/FrustumCulling";
import { Cluster } from "../../../d3/graphics/renderPath/Cluster";
import { LayaGL } from "../../../layagl/LayaGL";
import { Vector3 } from "../../../maths/Vector3";
import { RenderTexture } from "../../../resource/RenderTexture";
import { Stat } from "../../../utils/Stat";
import { RenderFeatureBase } from "./RenderFeatureBase";
import { RenderPassBase } from "./RenderPassBase";

export abstract class RendererBase {
    private renderScale:number;
    renderFeatures: Array<RenderFeatureBase>;
    activeRenderPasses: Array<RenderPassBase>;
    activeRenderTarget: RenderTexture;
    //current use camera
    currentCamera: Camera;
    cameraData: CameraData;

    //filtering
    opaqueCullingMask: number;
    transparentCullingMask: number;

    //after filter render queue;
    _opaqueQueue: IRenderQueue = LayaGL.renderOBJCreate.createBaseRenderQueue(false);
    _transparentQueue: IRenderQueue = LayaGL.renderOBJCreate.createBaseRenderQueue(true);

    commandEventBufferArray: { [key: string]: CommandBuffer[] };
    shadowCasterCommandBuffer: CommandBuffer[];

    constructor() {
        this.renderFeatures = new Array<RenderFeatureBase>;
        this.activeRenderPasses = new Array<RenderPassBase>;
    }

    get RenderScale():number{
        return this.renderScale || 1;
    }
    set RenderScale(value:number){
        var tmp = Math.min(2,value);
        tmp = Math.max(0.1,tmp)
        this.renderScale = tmp;
    }

    public abstract Setup(context: RenderContext3D, scene: Scene3D, cameraData: CameraData): void;

    public Execute(context: RenderContext3D, scene: Scene3D): void {
        //排序renderpass    
        this.sortRenderPass(this.activeRenderPasses)
        //shadow + prepass
        this.executeRenderPass(this.activeRenderPasses, context, scene, this, CameraEventFlags.BeforeRendering, CameraEventFlags.AfterPrePasses);
        //_main
        this.setRenderData(context, scene);
        this.bindRenderTarget(this.activeRenderTarget);
        scene._clear(context);

        //执行renderpass  depth + main 
        this.executeRenderPass(this.activeRenderPasses, context, scene, this, CameraEventFlags.AfterPrePasses, CameraEventFlags.BeforeImageEffect);
        
        this.unbindRenderTarget(this.activeRenderTarget);
        //pp
        this.executeRenderPass(this.activeRenderPasses, context, scene, this, CameraEventFlags.BeforeImageEffect, CameraEventFlags.AfterEveryThing);

        //TODO. aftereverything
        if (this.currentCamera._offScreenRenderTexture) {
            RenderTexture.bindCanvasRender = null;
        } else
            RenderTexture.bindCanvasRender = this.currentCamera._internalRenderTexture;
        // after rendering TODO. recover的问题导致的
        this.executeRenderPass(this.activeRenderPasses, context, scene, this, CameraEventFlags.AfterEveryThing, CameraEventFlags.AfterEveryThing);

        //执行完pass
        this.FinishRendering(context);
    }

    public FinishRendering(context: RenderContext3D) {
        this.activeRenderPasses.length = 0;
    }

    public AddRenderFeature(renderFeature: RenderFeatureBase) {
        let index = this.renderFeatures.indexOf(renderFeature)
        if (index == -1) {
            this.renderFeatures.push(renderFeature);
        }
    }

    public RemoveRenderFeature(renderFeature: RenderFeatureBase) {
        let index = this.renderFeatures.indexOf(renderFeature)
        if (index != -1)
            this.renderFeatures.splice(index, 1);
    }


    public AddRenderFeaturePasses() {
        this.renderFeatures.forEach(a => a.AddRenderPasses(this))
    }

    public EnqueuePass(pass: RenderPassBase) {
        this.activeRenderPasses.push(pass);
    }


    private recoverRenderContext3D(context: RenderContext3D, renderTexture: RenderTexture) {
        const cacheViewPor = Camera._context3DViewPortCatch;
        const cacheScissor = Camera._contextScissorPortCatch;
        context.changeViewport(cacheViewPor.x, cacheViewPor.y, cacheViewPor.width, cacheViewPor.height);
        context.changeScissor(cacheScissor.x, cacheScissor.y, cacheScissor.z, cacheScissor.w);
        context.destTarget = renderTexture;
        //bind framebuffer.
        context._contextOBJ.applyContext(Camera._updateMark);
    }

    private sortRenderPass(renderPassArray: RenderPassBase[]) {
        renderPassArray.sort(
            (a, b) => {
                return a.renderPassEvent - b.renderPassEvent;
            }
        );
    }



    private executeRenderPass(renderPassArray: RenderPassBase[], context: RenderContext3D, scene: Scene3D, renderer: RendererBase, startevt: CameraEventFlags, endevt: CameraEventFlags) {
        renderPassArray.forEach(
            a => {
                if (a.renderPassEvent >= startevt && a.renderPassEvent < endevt) {
                    a.Execute(context, scene, renderer);
                    this.recoverRenderContext3D(context, this.activeRenderTarget);
                    this.resetPipelineMode(context);
                }
            }
        )
    }

    //预裁剪
    _preCulling(context: RenderContext3D, isOpaque: boolean, scene: Scene3D, cullingMask?: number): void {
        this.clearRenderQueue();
        var cameraCullInfo: ICameraCullInfo = FrustumCulling._cameraCullInfo;
        var cameraPos = cameraCullInfo.position = this.currentCamera._transform.position;
        if (cullingMask) {
            cameraCullInfo.cullingMask = cullingMask;
        } else {
            cameraCullInfo.cullingMask = isOpaque ? this.opaqueCullingMask : this.transparentCullingMask;
        }
        cameraCullInfo.staticMask = this.currentCamera.staticMask;
        cameraCullInfo.boundFrustum = this.currentCamera.boundFrustum;
        cameraCullInfo.useOcclusionCulling = this.currentCamera.useOcclusionCulling;
        scene._cullPass.cullByCameraCullInfo(cameraCullInfo, scene.sceneRenderableManager);
        //addQueue
        let list = scene._cullPass.cullList;
        let element = list.elements;
        for (let i: number = 0; i < list.length; i++) {
            let render = element[i];
            render.distanceForSort = Vector3.distance(render.bounds.getCenter(), cameraPos);//TODO:合并计算浪费,或者合并后取平均值
            var elements: RenderElement[] = render._renderElements;
            for (var j: number = 0, m: number = elements.length; j < m; j++)
                elements[j]._updateInRenderer(this, context, context.customShader, context.replaceTag);
        }
    }

    /**
     * @internal 渲染Scene的各个管线
     */
    _drawRenderer(context: RenderContext3D, renderFlag: number): void {
        var camera: Camera = <Camera>context.camera;
        switch (renderFlag) {
            case Scene3D.SCENERENDERFLAG_RENDERQPAQUE:
                Stat.opaqueDrawCall += this._opaqueQueue.renderQueue(context);
                break;
            case Scene3D.SCENERENDERFLAG_SKYBOX:
                // TODO.
                // if (camera.clearFlag === CameraClearFlags.Sky) {
                //     if (camera.skyRenderer._isAvailable())
                //         camera.skyRenderer._render(context);
                //     else if (this._skyRenderer._isAvailable())
                //         this._skyRenderer._render(context);
                // }
                break;
            case Scene3D.SCENERENDERFLAG_RENDERTRANSPARENT:
                Stat.transDrawCall += this._transparentQueue.renderQueue(context);
                break;
        }
    }


    _getRenderQueue(index: number): IRenderQueue {
        if (index <= 2500)//2500作为队列临界点
            return this._opaqueQueue;
        else
            return this._transparentQueue;
    }

    /**
     * @internal
     */
    clearRenderQueue(): void {
        this._opaqueQueue.clear();
        this._transparentQueue.clear();
    }

    bindRenderTarget(rt: RenderTexture) {
        rt && rt._start();
    }

    unbindRenderTarget(rt: RenderTexture) {
        rt && rt._end();
    }

    private resetPipelineMode(context: RenderContext3D) {
        if (context.pipelineMode != context.configPipeLineMode){
            context.pipelineMode = context.configPipeLineMode;
        }
    }

    setRenderData(context: RenderContext3D, scene: Scene3D) {
        let camera = this.currentCamera;
        let cameraData = this.cameraData;
        //render main
        context.invertY = cameraData.invertY;
        context.viewport = cameraData.viewport;
        //设置context的渲染目标
        context.destTarget = cameraData.renderTex;
        //设置shader参数
        camera._prepareCameraToRender();
        var multiLighting: boolean = Config3D._multiLighting;
        (multiLighting) && (Cluster.instance.update(camera, <Scene3D>(scene)));

        context.customShader = cameraData.shader;
        context.replaceTag = cameraData.replacementTag;
        //设置shader的相机参数
        camera._applyViewProject(context, camera.viewMatrix, camera.projectionMatrix);
        if (camera._cameraUniformData) {//需要在Depth之前更新数据
            camera._cameraUniformUBO && camera._cameraUniformUBO.setDataByUniformBufferData(camera._cameraUniformData);
        }
        // if (this.depthTextureMode != 0) {
        //     //TODO:是否可以不多次
        // camera._renderDepthMode(context);
    }


    // applyCommandBuffer(event: CameraEventFlags, context: RenderContext3D) {

    // }

    // applyCasterShadowCommandBuffer(context: RenderContext3D) {

    // }

    // addCommandBuffer(event: CameraEventFlags, context: RenderContext3D) {

    // }

    // addCasterShadowCommandBuffer(commandBuffer: CommandBuffer) {

    // }

    // removeCommandBuffer(event: CameraEventFlags, context: RenderContext3D) {

    // }

    // removeCasterShadowCommandBuffer(commandBuffer: CommandBuffer) {

    // }
}