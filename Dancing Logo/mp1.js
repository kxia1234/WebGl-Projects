/**
 * @file MP1 Animation
 * @author Kevin Xia <kevinx3@illinois.edu>
 */

/** @global The WebGL context */
var gl;

/** @global The HTML5 canvas we draw on */
var canvas;

/** @global A simple GLSL shader program */
var shaderProgram;

/** @global The WebGL buffer holding the triangle */
var vertexPositionBuffer;

/** @global The WebGL buffer holding the vertex colors */
var vertexColorBuffer;

/** @global The rotation angle of our triangle */
var rotAngle = 0;

/** @global The ModelView matrix contains any modeling and viewing transformations */
var mvMatrix = mat4.create();

/** @global The scaling int used to scale my logo smaller */
var scale_int = 1;

/** @global The animation to display 0 (default) 1 (creative) */
var which_animation = 0;

/** @global The variable we scale sin by */
var scale_factor = 0;

/**
 * Switches between to the two animations
 * @param {Number} choice 0 (default) 1 (creative)
 */
function switch_anim(choice){
  cancelAnimationFrame(current_animation_frame);
  which_animation = choice;
  //console.log("click");
  startup();
}

/**
 * Translates degrees to radians
 * @param {Number} degrees Degree input to function
 * @return {Number} The radians that correspond to the degree input
 */
 function degToRad(degrees) {
         return degrees * Math.PI / 180;
 }

 /**
  * Creates a context for WebGL
  * @param {element} canvas WebGL canvas
  * @return {Object} WebGL context
  */
function createGLContext(canvas) {
  var names = ["webgl", "experimental-webgl"];
  var context = null;
  for (var i=0; i < names.length; i++) {
    try {
      context = canvas.getContext(names[i]);
    } catch(e) {}
    if (context) {
      break;
    }
  }
  if (context) {
    context.viewportWidth = canvas.width;
    context.viewportHeight = canvas.height;
  } else {
    alert("Failed to create WebGL context!");
  }
  return context;
}

/**
 * Loads Shaders
 * @param {string} id ID string for shader to load. Either vertex shader/fragment shader
 */
function loadShaderFromDOM(id) {
  var shaderScript = document.getElementById(id);

    // If we don't find an element with the specified id
    // we do an early exit
    if (!shaderScript) {
      return null;
    }

    var shaderSource = shaderScript.text;

    var shader;
    if (shaderScript.type == "x-shader/x-fragment") {
      shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (shaderScript.type == "x-shader/x-vertex") {
      shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
      return null;
    }

    gl.shaderSource(shader, shaderSource);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      alert(gl.getShaderInfoLog(shader));
      return null;
    }
    return shader;
  }

/**
 * Setup the fragment and vertex shaders
 */
function setupShaders() {
  vertexShader = loadShaderFromDOM("shader-vs");
  fragmentShader = loadShaderFromDOM("shader-fs");

  shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert("Failed to setup shaders");
  }

  gl.useProgram(shaderProgram);

  // Get the positions of the atytributes and uniforms in the shader program
  shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
  shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
  shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMvMatrix");

  //Enable the attribute variables we will send data to....
  gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
  gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);

}

/**
 * Populate buffers with data
 */
function setupBuffers() {
  vertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);

  // Default Animation Selected
  if(which_animation == 0){
    var triangleVertices = [
      // Blue Border (Top)
      -0.65,  0.95,  0.0,
       0.65,  0.95,  0.0,
      -0.65,  0.85,  0.0,

       0.65,  0.95,  0.0,
       0.65,  0.85,  0.0,
      -0.65,  0.85,  0.0,

     // Orange Recentagle Fill (Top)
      -0.55,  0.85,  0.0,
       0.55,  0.85,  0.0,
      -0.55,  0.55,  0.0,

       0.55,  0.55,  0.0,
       0.55,  0.85,  0.0,
      -0.55,  0.55,  0.0,

     // Blue Side (Top Left)
      -0.65,  0.85,  0.0,
      -0.55,  0.85,  0.0,
      -0.55,  0.45,  0.0,

      -0.65,  0.85,  0.0,
      -0.55,  0.45,  0.0,
      -0.65,  0.45,  0.0,

      // Blue Side (Top Right)
       0.65,  0.85,  0.0,
       0.55,  0.87,  0.0,
       0.55,  0.45,  0.0,

       0.65,  0.85,  0.0,
       0.55,  0.45,  0.0,
       0.65,  0.45,  0.0,

      // Blue Bottom (Bottom Left)
      -0.55,  0.55,  0.0,
      -0.33,  0.55,  0.0,
      -0.55,  0.45,  0.0,

      -0.33,  0.45,  0.0,
      -0.33,  0.55,  0.0,
      -0.55,  0.45,  0.0,

      // Blue Bottom (Bottom Right)
       0.55,  0.55,  0.0,
       0.33,  0.55,  0.0,
       0.55,  0.45,  0.0,

       0.33,  0.45,  0.0,
       0.33,  0.55,  0.0,
       0.55,  0.45,  0.0,

       // Middle Blue Border (Right)
       0.43,  0.45,  0.0,
       0.33,  0.45,  0.0,
       0.33,  -0.45,  0.0,

       0.43,  0.45,  0.0,
       0.33,  -0.45,  0.0,
       0.43,  -0.45,  0.0,

       // Middle Blue Border (Left)
      -0.43,  0.45,  0.0,
      -0.33,  0.45,  0.0,
      -0.33,  -0.45,  0.0,

      -0.43,  0.45,  0.0,
      -0.33,  -0.45,  0.0,
      -0.43,  -0.45,  0.0,

     // Middle Orange Fill
      -0.33,  0.55,  0.0,
      -0.33,  -0.55,  0.0,
       0.33,  -0.55,  0.0,

      -0.33,  0.55,  0.0,
       0.33,  -0.55,  0.0,
       0.33,  0.55,  0.0,

     // Blue Sliver (Bottom Top Right)
       0.55,  -0.55,  0.0,
       0.33,  -0.55,  0.0,
       0.55,  -0.45,  0.0,

       0.33,  -0.45,  0.0,
       0.33,  -0.55,  0.0,
       0.55,  -0.45,  0.0,

    // Blue Sliver (Bottom Top Left)
      -0.55,  -0.55,  0.0,
      -0.33,  -0.55,  0.0,
      -0.55,  -0.45,  0.0,

      -0.33,  -0.45,  0.0,
      -0.33,  -0.55,  0.0,
      -0.55,  -0.45,  0.0,

    // Blue Sliver (Bottom Side Left)
      -0.65,  -0.87,  0.0,
      -0.55,  -0.87,  0.0,
      -0.55,  -0.45,  0.0,

      -0.65,  -0.87,  0.0,
      -0.55,  -0.45,  0.0,
      -0.65,  -0.45,  0.0,

    // Blue Sliver (Bottom Side Right)
       0.65,  -0.87,  0.0,
       0.55,  -0.87,  0.0,
       0.55,  -0.45,  0.0,

       0.65,  -0.87,  0.0,
       0.55,  -0.45,  0.0,
       0.65,  -0.45,  0.0,

    // Blue Sliver (Bottom)
      -0.65,  -0.95,  0.0,
       0.65,  -0.95,  0.0,
      -0.65,  -0.85,  0.0,

       0.65,  -0.95,  0.0,
       0.65,  -0.85,  0.0,
      -0.65,  -0.85,  0.0,

    // Orange Fill (Bottom)
      -0.55,  -0.85,  0.0,
       0.55,  -0.85,  0.0,
      -0.55,  -0.55,  0.0,

       0.55,  -0.55,  0.0,
       0.55,  -0.85,  0.0,
      -0.55,  -0.55,  0.0,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangleVertices), gl.STATIC_DRAW);
    vertexPositionBuffer.itemSize = 3;
    vertexPositionBuffer.numberOfItems = 15*6;

    vertexColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
  }

  // Creative Animation Selected
  if(which_animation == 1){
    var triangleVertices = [
      // Piece of Paper Triangles
      -0.8,  0.4,  0.0,
      -0.7,  0.4,  0.0,
      -0.8,  0.3,  0.0,
      -0.8,  0.3,  0.0,
      -0.7,  0.3,  0.0,
      -0.7,  0.4,  0.0,
  ];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangleVertices), gl.STATIC_DRAW);

  vertexPositionBuffer.itemSize = 3;
  vertexPositionBuffer.numberOfItems = 6*3;

  vertexColorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
  }

  // Default Animation Selected
  if(which_animation == 0){
  var colors = [
      // Blue Border (Top)
      0.074, 0.160, 0.294, 1,
      0.074, 0.160, 0.294, 1,
      0.074, 0.160, 0.294, 1,

      0.074, 0.160, 0.294, 1,
      0.074, 0.160, 0.294, 1,
      0.074, 0.160, 0.294, 1,

      // Orange Recentagle Fill (Top)
      0.909, 0.290, 0.152, 1,
      0.909, 0.290, 0.152, 1,
      0.909, 0.290, 0.152, 1,

      0.909, 0.290, 0.152, 1,
      0.909, 0.290, 0.152, 1,
      0.909, 0.290, 0.152, 1,

      // Blue Side (Top Left)
      0.074, 0.160, 0.294, 1,
      0.074, 0.160, 0.294, 1,
      0.074, 0.160, 0.294, 1,

      0.074, 0.160, 0.294, 1,
      0.074, 0.160, 0.294, 1,
      0.074, 0.160, 0.294, 1,

      // Blue Side (Top Right)
      0.074, 0.160, 0.294, 1,
      0.074, 0.160, 0.294, 1,
      0.074, 0.160, 0.294, 1,

      0.074, 0.160, 0.294, 1,
      0.074, 0.160, 0.294, 1,
      0.074, 0.160, 0.294, 1,

      // Blue Bottom (Bottom Left)
      0.074, 0.160, 0.294, 1,
      0.074, 0.160, 0.294, 1,
      0.074, 0.160, 0.294, 1,

      0.074, 0.160, 0.294, 1,
      0.074, 0.160, 0.294, 1,
      0.074, 0.160, 0.294, 1,

      // Blue Bottom (Bottom Right)
      0.074, 0.160, 0.294, 1,
      0.074, 0.160, 0.294, 1,
      0.074, 0.160, 0.294, 1,

      0.074, 0.160, 0.294, 1,
      0.074, 0.160, 0.294, 1,
      0.074, 0.160, 0.294, 1,

      // Middle Blue Borders
      0.074, 0.160, 0.294, 1,
      0.074, 0.160, 0.294, 1,
      0.074, 0.160, 0.294, 1,

      0.074, 0.160, 0.294, 1,
      0.074, 0.160, 0.294, 1,
      0.074, 0.160, 0.294, 1,

      0.074, 0.160, 0.294, 1,
      0.074, 0.160, 0.294, 1,
      0.074, 0.160, 0.294, 1,

      0.074, 0.160, 0.294, 1,
      0.074, 0.160, 0.294, 1,
      0.074, 0.160, 0.294, 1,

      // Orange Middle Fill
      0.909, 0.290, 0.152, 1,
      0.909, 0.290, 0.152, 1,
      0.909, 0.290, 0.152, 1,

      0.909, 0.290, 0.152, 1,
      0.909, 0.290, 0.152, 1,
      0.909, 0.290, 0.152, 1,


      // Blue Sliver (Bottom Top Right)
      0.074, 0.160, 0.294, 1,
      0.074, 0.160, 0.294, 1,
      0.074, 0.160, 0.294, 1,

      0.074, 0.160, 0.294, 1,
      0.074, 0.160, 0.294, 1,
      0.074, 0.160, 0.294, 1,

      // Blue Sliver (Bottom Top Left)
      0.074, 0.160, 0.294, 1,
      0.074, 0.160, 0.294, 1,
      0.074, 0.160, 0.294, 1,

      0.074, 0.160, 0.294, 1,
      0.074, 0.160, 0.294, 1,
      0.074, 0.160, 0.294, 1,

      // Blue Sliver (Bottom Side Left)
      0.074, 0.160, 0.294, 1,
      0.074, 0.160, 0.294, 1,
      0.074, 0.160, 0.294, 1,

      0.074, 0.160, 0.294, 1,
      0.074, 0.160, 0.294, 1,
      0.074, 0.160, 0.294, 1,

      // Blue Sliver (Bottom Side Right)
      0.074, 0.160, 0.294, 1,
      0.074, 0.160, 0.294, 1,
      0.074, 0.160, 0.294, 1,

      0.074, 0.160, 0.294, 1,
      0.074, 0.160, 0.294, 1,
      0.074, 0.160, 0.294, 1,

      // Blue Sliver (Bottom)
      0.074, 0.160, 0.294, 1,
      0.074, 0.160, 0.294, 1,
      0.074, 0.160, 0.294, 1,

      0.074, 0.160, 0.294, 1,
      0.074, 0.160, 0.294, 1,
      0.074, 0.160, 0.294, 1,

      // Orange Fill (Bottom)
      0.909, 0.290, 0.152, 1,
      0.909, 0.290, 0.152, 1,
      0.909, 0.290, 0.152, 1,

      0.909, 0.290, 0.152, 1,
      0.909, 0.290, 0.152, 1,
      0.909, 0.290, 0.152, 1,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

    vertexColorBuffer.itemSize = 4;
    vertexColorBuffer.numItems = 15*6;
  }

// Creative Animation Selected
if(which_animation == 1){
    var colors = [
      // Black Color
      0,0,0,1,
      0,0,0,1,
      0,0,0,1,
      0,0,0,1,
      0,0,0,1,
      0,0,0,1,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

    vertexColorBuffer.itemSize = 4;
    vertexColorBuffer.numItems = 6*4;
  }
}

/**
 * Draw model...render a frame
 */
function draw() {
  gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
  gl.clear(gl.COLOR_BUFFER_BIT);

  mat4.identity(mvMatrix);

  // Default Animation Selected
  if(which_animation == 0){
  // used https://p5js.org/reference/#/p5/rotateY to change Vertex Shader
   mat4.rotateY(mvMatrix, mvMatrix, degToRad(rotAngle));
   mat4.scale(mvMatrix, mvMatrix, [scale_int, scale_int, scale_int]);
  }

  // Creative Animation Selected
  if(which_animation == 1){
    mat4.rotateX(mvMatrix, mvMatrix, degToRad(rotAngle));
    mat4.rotateY(mvMatrix, mvMatrix, degToRad(rotAngle));
    mat4.rotateZ(mvMatrix, mvMatrix, degToRad(rotAngle));
  }

  // If these buffers don't change, you can set the atribute pointer just once at
  //  rather than each frame
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute,
                         vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexColorAttribute,
                            vertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);


  // Send the current  ModelView matrix to the vertex shader
  gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);

  // Render the triangle
  gl.drawArrays(gl.TRIANGLES, 0, vertexPositionBuffer.numberOfItems);
}

/**
 * Startup Function to Setup Buffer, Shadders and Clears Colors
 */
function startup() {
  canvas = document.getElementById("myGLCanvas");
  gl = createGLContext(canvas);
  setupShaders();
  setupBuffers();
  gl.clearColor(1.0, 1.0, 1.0, 1.0);
  gl.enable(gl.DEPTH_TEST);
  tick();
}

/**
 * This function "ticks" through our animnation by drawing the scene
 * and running my custom animation function. It also stores my current
 * animation frame so my other animation can be toggled to smoothly
 */
function tick() {
  current_animation_frame = requestAnimFrame(tick);
  draw();
  animate();
}

/**
 * Animate function that contains instructions on how to animate both animations
 */
function animate() {
  // Default Animation Selected
  if(which_animation == 0){
  rotAngle = (rotAngle + 1) % 360;

  scale_int -= 0.002;

  if(scale_int <= 0){
    scale_int = 1;
  }

  scale_factor += 0.1;
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);

  // Each vertice is changed by adding a sin function to the X coordinate
  // and a cos function on the Y function to produce a "jiggle".
  // To only keep the top jiggling, I bounded my coordinates of all the
  // bottom vertcies of the logo.
  var triangleVertices = [
    // Blue Border (Top)
    -0.65+Math.sin(scale_factor)*0.07,  0.95+Math.cos(scale_factor)*0.07,  0.0,
     0.65+Math.sin(scale_factor)*0.07,  0.95+Math.cos(scale_factor)*0.07,  0.0,
    -0.65+Math.sin(scale_factor)*0.07,  0.85+Math.cos(scale_factor)*0.07,  0.0,

     0.65+Math.sin(scale_factor)*0.07,  0.95+Math.cos(scale_factor)*0.07,  0.0,
     0.65+Math.sin(scale_factor)*0.07,  0.85+Math.cos(scale_factor)*0.07,  0.0,
    -0.65+Math.sin(scale_factor) *0.07,  0.85+Math.cos(scale_factor)*0.07,  0.0,

    // Orange Recentagle Fill (Top)
    -0.55+Math.sin(scale_factor)*0.07,  0.85+Math.cos(scale_factor)*0.07,  0.0,
     0.55+Math.sin(scale_factor)*0.07,  0.85+Math.cos(scale_factor)*0.07,  0.0,
    -0.55+Math.sin(scale_factor)*0.07,  0.55+Math.cos(scale_factor)*0.07,  0.0,

     0.55+Math.sin(scale_factor)*0.07,  0.55+Math.cos(scale_factor)*0.07,  0.0,
     0.55+Math.sin(scale_factor)*0.07,  0.85+Math.cos(scale_factor)*0.07,  0.0,
    -0.55+Math.sin(scale_factor) *0.07,  0.55+Math.cos(scale_factor)*0.07,  0.0,

    // Blue Side (Top Left)
    -0.65+Math.sin(scale_factor)*0.07,  0.85+Math.cos(scale_factor)*0.07,  0.0,
    -0.55+Math.sin(scale_factor)*0.07,  0.85+Math.cos(scale_factor)*0.07,  0.0,
    -0.55+Math.sin(scale_factor)*0.07,  0.45+Math.cos(scale_factor)*0.07,  0.0,

    -0.65+Math.sin(scale_factor)*0.07,  0.85+Math.cos(scale_factor)*0.07,  0.0,
    -0.55+Math.sin(scale_factor)*0.07,  0.45+Math.cos(scale_factor)*0.07,  0.0,
    -0.65+Math.sin(scale_factor) *0.07,  0.45+Math.cos(scale_factor)*0.07,  0.0,

    // Blue Side (Top Right)
     0.65+Math.sin(scale_factor)*0.07,  0.85+Math.cos(scale_factor)*0.07,  0.0,
     0.55+Math.sin(scale_factor)*0.07,  0.85+Math.cos(scale_factor)*0.07,  0.0,
     0.55+Math.sin(scale_factor)*0.07,  0.45+Math.cos(scale_factor)*0.07,  0.0,

     0.65+Math.sin(scale_factor)*0.07,  0.85+Math.cos(scale_factor)*0.07,  0.0,
     0.55+Math.sin(scale_factor)*0.07,  0.45+Math.cos(scale_factor)*0.07,  0.0,
     0.65+Math.sin(scale_factor) *0.07,  0.45+Math.cos(scale_factor)*0.07,  0.0,

     // Blue Bottom (Bottom Left)
    -0.55+Math.sin(scale_factor)*0.07,  0.55+Math.cos(scale_factor)*0.07,  0.0,
    -0.33+Math.sin(scale_factor)*0.07,  0.55+Math.cos(scale_factor)*0.07,  0.0,
    -0.55+Math.sin(scale_factor)*0.07,  0.45+Math.cos(scale_factor)*0.07,  0.0,

    -0.33+Math.sin(scale_factor)*0.07,  0.45+Math.cos(scale_factor)*0.07,  0.0,
    -0.33+Math.sin(scale_factor)*0.07,  0.55+Math.cos(scale_factor)*0.07,  0.0,
    -0.55+Math.sin(scale_factor) *0.07,  0.45+Math.cos(scale_factor)*0.07,  0.0,

    // Blue Bottom (Bottom Right)
     0.55+Math.sin(scale_factor)*0.07,  0.55+Math.cos(scale_factor)*0.07,  0.0,
     0.33+Math.sin(scale_factor)*0.07,  0.55+Math.cos(scale_factor)*0.07,  0.0,
     0.55+Math.sin(scale_factor)*0.07,  0.45+Math.cos(scale_factor)*0.07,  0.0,

     0.33+Math.sin(scale_factor)*0.07,  0.45+Math.cos(scale_factor)*0.07,  0.0,
     0.33+Math.sin(scale_factor)*0.07,  0.55+Math.cos(scale_factor)*0.07,  0.0,
     0.55+Math.sin(scale_factor) *0.07,  0.45+Math.cos(scale_factor)*0.07,  0.0,

     // Middle Blue Border (Right)
     0.43+Math.sin(scale_factor)*0.07,  0.45+Math.cos(scale_factor)*0.07,  0.0,
     0.33+Math.sin(scale_factor)*0.07,  0.45+Math.cos(scale_factor)*0.07,  0.0,
     0.33,  -0.45,  0.0,

     0.43+Math.sin(scale_factor)*0.07,  0.45+Math.cos(scale_factor)*0.07,  0.0,
     0.33,  -0.45,  0.0,
     0.43,  -0.45,  0.0,

     // Middle Blue Border (Left)
    -0.43+Math.sin(scale_factor)*0.07,  0.45+Math.cos(scale_factor)*0.07,  0.0,
    -0.33+Math.sin(scale_factor)*0.07,  0.45+Math.cos(scale_factor)*0.07,  0.0,
    -0.33,  -0.45,  0.0,

    -0.43+Math.sin(scale_factor)*0.07,  0.45+Math.cos(scale_factor)*0.07,  0.0,
    -0.33,  -0.45,  0.0,
    -0.43,  -0.45,  0.0,

    // Middle Orange Fill
    -0.33+Math.sin(scale_factor)*0.07,  0.55+Math.cos(scale_factor)*0.07,  0.0,
    -0.33,  -0.55,  0.0,
     0.33,  -0.55,  0.0,

    -0.33+Math.sin(scale_factor)*0.07,  0.55+Math.cos(scale_factor)*0.07,  0.0,
     0.33,  -0.55,  0.0,
     0.33+Math.sin(scale_factor) *0.07,  0.55+Math.cos(scale_factor)*0.07,  0.0,
    ];

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangleVertices), gl.STATIC_DRAW);
    vertexPositionBuffer.itemSize = 3;
    vertexPositionBuffer.numberOfItems = 96;
  }

  // Creative Animation Selected
  if(which_animation == 1){
    rotAngle = (rotAngle+1) % 360;
    scale_int -= 0.02;
  }
}
