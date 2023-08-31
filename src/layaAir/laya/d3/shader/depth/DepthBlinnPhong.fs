#define SHADER_NAME DepthFS

#include "DepthFrag.glsl";
varying vec2 v_Texcoord0;

void main()
{
#ifdef ALPHATEST
    vec4 color = texture2D(u_DiffuseTexture,v_Texcoord0);
    if(color.r < u_AlphaTestValue){
        discard;
    }
#endif
    gl_FragColor = getDepthColor();
}