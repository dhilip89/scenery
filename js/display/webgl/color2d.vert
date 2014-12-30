//This shader assumes 2d vertices that have a specified color.

// Position
attribute vec2 aPosition;

// Color for the vertex
attribute vec4 aVertexColor;

// Output to the fragment shader
varying vec4 vColor;

// (x,y) size of the viewport
uniform vec2 uResolution;

void main(void) {

  //This transform code is based on http://www.html5rocks.com/en/tutorials/webgl/webgl_fundamentals/
  //TODO: Should be converted to matrix multiply, probably faster.

  // convert the rectangle from pixels to 0.0 to 1.0
  vec2 zeroToOne = aPosition / uResolution;

  // convert from 0->1 to 0->2
  vec2 zeroToTwo = zeroToOne * 2.0;

  // convert from 0->2 to -1->+1 (clipspace)
  vec2 clipSpace = zeroToTwo - 1.0;

  gl_Position = vec4(clipSpace * vec2(1, -1), 0., 1.); //0. is the z, and 1 is w
  vColor = aVertexColor;
}