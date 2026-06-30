precision highp float;

#include <color>

in vec2 v_uv;

out vec4 fragment_color;

uniform sampler2D mainTexture;
uniform float exposure;

vec3 reinhard_tonemapping(vec3 color, float exposure) {
  vec3 exposed_color = color * exposure;

  return exposed_color / (exposed_color + vec3(1.0));
}

vec3 aces_filmic_tonemapping(vec3 color, float exposure) {
  vec3 exposed_color = color * exposure;

  return clamp(
    (exposed_color * (2.51 * exposed_color + vec3(0.03))) /
    (exposed_color * (2.43 * exposed_color + vec3(0.59)) + vec3(0.14)),
    0.0,
    1.0
  );
}

vec3 agx_default_contrast_approx(vec3 color) {
  vec3 color_squared = color * color;
  vec3 color_quad = color_squared * color_squared;

  return
    15.5 * color_quad * color_squared -
    40.14 * color_quad * color +
    31.96 * color_quad -
    6.868 * color_squared * color +
    0.4298 * color_squared +
    0.1191 * color -
    0.00232;
}

vec3 agx_tonemapping(vec3 color, float exposure) {
  const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
    vec3(0.6274, 0.0691, 0.0164),
    vec3(0.3293, 0.9195, 0.0880),
    vec3(0.0433, 0.0113, 0.8956)
  );
  const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
    vec3(1.6605, -0.1246, -0.0182),
    vec3(-0.5876, 1.1329, -0.1006),
    vec3(-0.0728, -0.0083, 1.1187)
  );
  const mat3 AGX_INSET_MATRIX = mat3(
    vec3(0.856627153315983, 0.137318972929847, 0.11189821299995),
    vec3(0.0951212405381588, 0.761241990602591, 0.0767994186031903),
    vec3(0.0482516061458583, 0.101439036467562, 0.811302368396859)
  );
  const mat3 AGX_OUTSET_MATRIX = mat3(
    vec3(1.1271005818144368, -0.1413297634984383, -0.14132976349843826),
    vec3(-0.11060664309660323, 1.157823702216272, -0.11060664309660294),
    vec3(-0.016493938717834573, -0.016493938717834257, 1.2519364065950405)
  );
  const float min_ev = -12.47393;
  const float max_ev = 4.026069;

  vec3 exposed_color = color * exposure;

  exposed_color = LINEAR_SRGB_TO_LINEAR_REC2020 * exposed_color;
  exposed_color = AGX_INSET_MATRIX * exposed_color;
  exposed_color = max(exposed_color, vec3(1e-10));
  exposed_color = log2(exposed_color);
  exposed_color = (exposed_color - min_ev) / (max_ev - min_ev);
  exposed_color = clamp(exposed_color, 0.0, 1.0);
  exposed_color = agx_default_contrast_approx(exposed_color);
  exposed_color = AGX_OUTSET_MATRIX * exposed_color;
  exposed_color = pow(max(vec3(0.0), exposed_color), vec3(2.2));
  exposed_color = LINEAR_REC2020_TO_LINEAR_SRGB * exposed_color;

  return clamp(exposed_color, 0.0, 1.0);
}

vec3 khronos_pbr_neutral_tonemapping(vec3 color, float exposure) {
  const float start_compression = 0.8 - 0.04;
  const float desaturation = 0.15;

  vec3 exposed_color = color * exposure;
  float x = min(exposed_color.r, min(exposed_color.g, exposed_color.b));
  float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;

  exposed_color -= offset;

  float peak = max(exposed_color.r, max(exposed_color.g, exposed_color.b));
  if (peak < start_compression) {
    return exposed_color;
  }

  float d = 1.0 - start_compression;
  float new_peak = 1.0 - d * d / (peak + d - start_compression);

  exposed_color *= new_peak / peak;

  float g = 1.0 - 1.0 / (desaturation * (peak - new_peak) + 1.0);

  return mix(exposed_color, vec3(new_peak), g);
}

void main() {
  vec4 source_color = texture(mainTexture, v_uv);

  #if defined(REINHARD_TONEMAP)
    vec3 mapped_color = source_color.rgb;
    mapped_color = reinhard_tonemapping(mapped_color, exposure);
    fragment_color = vec4(quick_linear_to_sRGB(mapped_color), source_color.a);
  #elif defined(ACES_FILMIC_TONEMAP)
    vec3 mapped_color = source_color.rgb;
    mapped_color = aces_filmic_tonemapping(mapped_color, exposure);
    fragment_color = vec4(quick_linear_to_sRGB(mapped_color), source_color.a);
  #elif defined(AGX_TONEMAP)
    vec3 mapped_color = source_color.rgb;
    mapped_color = agx_tonemapping(mapped_color, exposure);
    fragment_color = vec4(quick_linear_to_sRGB(mapped_color), source_color.a);
  #elif defined(KHRONOS_PBR_NEUTRAL_TONEMAP)
    vec3 mapped_color = source_color.rgb;
    mapped_color = khronos_pbr_neutral_tonemapping(mapped_color, exposure);
    fragment_color = vec4(quick_linear_to_sRGB(mapped_color), source_color.a);
  #else
    fragment_color = source_color;
  #endif
}
