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
  #else
    fragment_color = source_color;
  #endif
}
