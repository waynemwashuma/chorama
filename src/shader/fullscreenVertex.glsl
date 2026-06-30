precision mediump float;

out vec2 v_uv;

void main() {
  vec2 position = vec2(
    float((gl_VertexID << 1) & 2),
    float(gl_VertexID & 2)
  );

  v_uv = position * 0.5;
  gl_Position = vec4(position * 2.0 - 1.0, 0.0, 1.0);
}
