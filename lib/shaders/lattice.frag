#include <flutter/runtime_effect.glsl>

uniform vec2 uSize;
uniform float uTime;
uniform float uFrequency;
uniform float uAmplitude;
uniform float uSpeed;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;
uniform vec3 uColor4;

const float sizeCalc = 50;

out vec4 fragColor;

float hash12(vec2 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.yx + 33.33);
  return fract((p.x + p.y) * p.x);
}

// 2D随机向量生成
vec2 random2(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return fract(sin(p) * 43758.5453);
}

// 晶格化函数
vec2 crystallizeUV(vec2 uv) {
  float calcX = uSize.x / sizeCalc;
  float calcY = uSize.y / sizeCalc;
  vec2 scaledUV = vec2(uv.x * calcX, uv.y * calcY);
  vec2 iUV = floor(scaledUV);
  vec2 fUV = fract(scaledUV);

  float minDist = 2.0;
  vec2 nearestPoint = vec2(0.0);

  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 neighbor = vec2(float(x), float(y));

      // 使用哈希生成稳定的随机点
      vec2 point = random2(iUV + neighbor);

      // 添加动态效果但更平滑
      float timeOffset = uTime * uSpeed * 2;
      point = 0.5 + 0.5 * sin(timeOffset + 6.2831 * point);

      vec2 diff = neighbor + point - fUV;
      float dist = dot(diff, diff);

      if (dist < minDist) {
        minDist = dist;
        nearestPoint = iUV + neighbor + point;
      }
    }
  }

  return vec2(nearestPoint.x / calcX, nearestPoint.y / calcY);
}

// 颜色混合函数
vec3 blendColors(vec2 uv) {
  float xBlend = smoothstep(0.0, 1.0, uv.x);
  float yBlend = smoothstep(0.0, 1.0, uv.y);

  vec3 colHoriz1 = mix(uColor1, uColor2, xBlend);
  vec3 colHoriz2 = mix(uColor3, uColor4, xBlend);

  return mix(colHoriz1, colHoriz2, yBlend);
}

// 改进边缘光晕效果
float edgeGlow(vec2 uv, float sharpness) {
  vec2 centerDist = abs(uv - 0.5) * 2.0;
  float edge = max(centerDist.x, centerDist.y);
  return 1.0 - pow(edge, sharpness);
}

void main() {
  vec2 uv = FlutterFragCoord().xy / uSize;

  // 添加UV偏移和缩放以改善视觉效果
  vec2 centeredUV = (uv - 0.5) * 1.1 + 0.5;

  // 应用晶格化效果
  vec2 crystalUV = crystallizeUV(centeredUV);

  // 获取最终颜色
  vec3 finalColor = blendColors(crystalUV);
  float glow = edgeGlow(crystalUV, 2.0);
  finalColor = mix(finalColor * 0.85, finalColor, glow);

  fragColor = vec4(finalColor, 1.0);
}