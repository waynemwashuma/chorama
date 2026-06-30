precision highp float;

#include <color>

in vec2 v_uv;

out vec4 fragment_color;

uniform sampler2D mainTexture;

vec3 reinhard_tonemapping(vec3 color) {
  return color / (color + vec3(1.0));
}

void main() {
  vec4 source_color = texture(mainTexture, v_uv);
  vec3 mapped_color = reinhard_tonemapping(source_color.rgb);

  fragment_color = vec4(quick_linear_to_sRGB(mapped_color), source_color.a);
}
