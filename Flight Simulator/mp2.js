
/**
 * @file A simple WebGL example drawing central Illinois style terrain
 * @author Kevin Xia <kevinx3@illinois.edu>
 * @author Eric Shaffer <shaffer1@illinois.edu>
 */

// PART 2 //
/** @global Create a quaternion to manipulate to simulate flight */
var rot_quat = glMatrix.quat.create();

/** @global Create a vector3 to manipulate flight movement */
var movement_vec3 = glMatrix.vec3.create();

/** @global Create a var to manipulate starting flight speed */
var plane_speed = -0.0005;

/** @global Create a temp variable to take cross products */
var cross_product_vec3 = glMatrix.vec3.create();

/** @global Flag to enable and disable fog */
var fog_boolean = 0;

// PART 1 //
/** @global The WebGL context */
var gl;

/** @global The HTML5 canvas we draw on */
var canvas;

/** @global A simple GLSL shader program */
var shaderProgram;

/** @global The Modelview matrix */
var mvMatrix = glMatrix.mat4.create();

/** @global The Projection matrix */
var pMatrix = glMatrix.mat4.create();

/** @global The Normal matrix */
var nMatrix = glMatrix.mat3.create();

/** @global A glMatrix vector to use for transformations */
var transformVec = glMatrix.vec3.create();

// Initialize the vector....
glMatrix.vec3.set(transformVec,0.0,0.0,-2.0);

/** @global An object holding the geometry for a 3D terrain */
var myTerrain;

// View parameters
/** @global Location of the camera in world coordinates */
var eyePt = glMatrix.vec3.fromValues(0.0,0.2, -0.3);
/** @global Direction of the view in world coordinates */
var viewDir = glMatrix.vec3.fromValues(0.0,-0.123,-1.0);
/** @global Up vector for view matrix creation, in world coordinates */
var up = glMatrix.vec3.fromValues(0.0,2.0,0.0);
/** @global Location of a point along viewDir in world coordinates */
var viewPt = glMatrix.vec3.fromValues(0.0,0.0,0.0);

//Light parameters
/** @global Light position in VIEW coordinates */
var lightPosition = [0,1,3];
/** @global Ambient light color/intensity for Phong reflection */
var lAmbient = [0,0,0];
/** @global Diffuse light color/intensity for Phong reflection */
var lDiffuse = [1,1,1];
/** @global Specular light color/intensity for Phong reflection */
var lSpecular =[0,0,0];

//Material parameters
/** @global Ambient material color/intensity for Phong reflection */
var kAmbient = [1.0,1.0,1.0];
/** @global Diffuse material color/intensity for Phong reflection */
var kTerrainDiffuse = [205.0/255.0,163.0/255.0,63.0/255.0];
/** @global Specular material color/intensity for Phong reflection */
var kSpecular = [0.0,0.0,0.0];
/** @global Shininess exponent for Phong reflection */
var shininess = 23;
/** @global Edge color fpr wireframeish rendering */
var kEdgeBlack = [0.0,0.0,0.0];
/** @global Edge color for wireframe rendering */
var kEdgeWhite = [1.0,1.0,1.0];

//-------------------------------------------------------------------------
/**
 * Sends Modelview matrix to shader
 */
function uploadModelViewMatrixToShader() {
  gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
}

//-------------------------------------------------------------------------
/**
 * Sends projection matrix to shader
 */
function uploadProjectionMatrixToShader() {
  gl.uniformMatrix4fv(shaderProgram.pMatrixUniform,
                      false, pMatrix);
}

//-------------------------------------------------------------------------
/**
 * Generates and sends the normal matrix to the shader
 */
function uploadNormalMatrixToShader() {
  glMatrix.mat3.fromMat4(nMatrix,mvMatrix);
  glMatrix.mat3.transpose(nMatrix,nMatrix);
  glMatrix.mat3.invert(nMatrix,nMatrix);
  gl.uniformMatrix3fv(shaderProgram.nMatrixUniform, false, nMatrix);
}

//----------------------------------------------------------------------------------
/**
 * Sends projection/modelview matrices to shader
 */
function setMatrixUniforms() {
    uploadModelViewMatrixToShader();
    uploadNormalMatrixToShader();
    uploadProjectionMatrixToShader();
}

//----------------------------------------------------------------------------------
/**
 * Translates degrees to radians
 * @param {Number} degrees Degree input to function
 * @return {Number} The radians that correspond to the degree input
 */
function degToRad(degrees) {
        return degrees * Math.PI / 180;
}

//----------------------------------------------------------------------------------
/**
 * Creates a context for WebGL
 * @param {element} canvas WebGL canvas
 * @return {Object} WebGL context
 */
/**
 * Creates a context for WebGL
 * @param {element} canvas WebGL canvas
 * @return {Object} WebGL context
 */
function createGLContext(canvas) {
  var context = null;
  context = canvas.getContext("webgl");
  if (context) {
    context.viewportWidth = canvas.width;
    context.viewportHeight = canvas.height;
  } else {
    alert("Failed to create WebGL context!");
  }
  return context;
}

//----------------------------------------------------------------------------------
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

//----------------------------------------------------------------------------------
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

  shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
  gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

  shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
  gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);

  shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
  shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
  shaderProgram.nMatrixUniform = gl.getUniformLocation(shaderProgram, "uNMatrix");
  shaderProgram.uniformLightPositionLoc = gl.getUniformLocation(shaderProgram, "uLightPosition");
  shaderProgram.uniformAmbientLightColorLoc = gl.getUniformLocation(shaderProgram, "uAmbientLightColor");
  shaderProgram.uniformDiffuseLightColorLoc = gl.getUniformLocation(shaderProgram, "uDiffuseLightColor");
  shaderProgram.uniformSpecularLightColorLoc = gl.getUniformLocation(shaderProgram, "uSpecularLightColor");
  shaderProgram.uniformShininessLoc = gl.getUniformLocation(shaderProgram, "uShininess");
  shaderProgram.uniformAmbientMaterialColorLoc = gl.getUniformLocation(shaderProgram, "uKAmbient");
  shaderProgram.uniformDiffuseMaterialColorLoc = gl.getUniformLocation(shaderProgram, "uKDiffuse");
  shaderProgram.uniformSpecularMaterialColorLoc = gl.getUniformLocation(shaderProgram, "uKSpecular");

  // Setup Shader for Fog //
  shaderProgram.uniform_fog = gl.getUniformLocation(shaderProgram, "flag_enable_html");

  // Setup Shaders for Z Max and Min //
  shaderProgram.uniform_max = gl.getUniformLocation(shaderProgram, "shader_maxZ");
  shaderProgram.uniform_min = gl.getUniformLocation(shaderProgram, "shader_minZ");
}

//-------------------------------------------------------------------------
/**
 * Sends material information to the shader
 * @param {Float32} alpha shininess coefficient
 * @param {Float32Array} a Ambient material color
 * @param {Float32Array} d Diffuse material color
 * @param {Float32Array} s Specular material color
 */
function setMaterialUniforms(alpha,a,d,s) {
  gl.uniform1f(shaderProgram.uniformShininessLoc, alpha);
  gl.uniform3fv(shaderProgram.uniformAmbientMaterialColorLoc, a);
  gl.uniform3fv(shaderProgram.uniformDiffuseMaterialColorLoc, d);
  gl.uniform3fv(shaderProgram.uniformSpecularMaterialColorLoc, s);
}

//-------------------------------------------------------------------------
/**
 * Sends light information to the shader
 * @param {Float32Array} loc Location of light source
 * @param {Float32Array} a Ambient light strength
 * @param {Float32Array} d Diffuse light strength
 * @param {Float32Array} s Specular light strength
 */
function setLightUniforms(loc,a,d,s) {
  gl.uniform3fv(shaderProgram.uniformLightPositionLoc, loc);
  gl.uniform3fv(shaderProgram.uniformAmbientLightColorLoc, a);
  gl.uniform3fv(shaderProgram.uniformDiffuseLightColorLoc, d);
  gl.uniform3fv(shaderProgram.uniformSpecularLightColorLoc, s);
}

//----------------------------------------------------------------------------------
/**
 * Populate buffers with data
 */
function setupBuffers() {
    myTerrain = new Terrain(100,-0.5,0.5,-0.5,0.5);
    myTerrain.loadBuffers();
}

//----------------------------------------------------------------------------------
/**
 * Draw call that applies matrix transformations to model and draws model in frame
 */
function draw() {
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // We'll use perspective
    glMatrix.mat4.perspective(pMatrix,degToRad(45),
                     gl.viewportWidth / gl.viewportHeight,
                     0.1, 200.0);

    // We want to look down -z, so create a lookat point in that direction
    glMatrix.vec3.add(viewPt, eyePt, viewDir);
    // Then generate the lookat matrix and initialize the MV matrix to that view
    glMatrix.mat4.lookAt(mvMatrix,eyePt,viewPt,up);

    //Draw Terrain
    glMatrix.mat4.translate(mvMatrix, mvMatrix,transformVec);
    glMatrix.mat4.rotateX(mvMatrix, mvMatrix, degToRad(-75));
    setMatrixUniforms();
    setLightUniforms(lightPosition,lAmbient,lDiffuse,lSpecular);

    // Set Uniforms for Z //
    gl.uniform1f(shaderProgram.uniform_max, myTerrain.shader_maxZ);
    gl.uniform1f(shaderProgram.uniform_min, myTerrain.shader_minZ);

    if ((document.getElementById("polygon").checked) || (document.getElementById("wirepoly").checked))
    {
      setMaterialUniforms(shininess,kAmbient,kTerrainDiffuse,kSpecular);
      myTerrain.drawTriangles();
    }

    if(document.getElementById("wirepoly").checked)
    {
      setMaterialUniforms(shininess,kAmbient,kEdgeBlack,kSpecular);
      myTerrain.drawEdges();
    }

    if(document.getElementById("wireframe").checked)
    {
      setMaterialUniforms(shininess,kAmbient,kEdgeWhite,kSpecular);
      myTerrain.drawEdges();
    }
  //  requestAnimationFrame(draw); <- calling requestAnimationFrame through tick() function now
}

//----------------------------------------------------------------------------------
/**
 * Animate call that produces the animation to simulate flight
 */
function flight_animate(){
  var turn_rate = 0.15;
  var speed_increments = 0.0001;
  var min_speed = -0.0003;
  var amount_roll = 0;
  var amount_pitch = 0;

  // CODE TO POLL KEY PRESSES //
  if (currentlyPressedKeys["s"]){
    amount_pitch = amount_pitch - degToRad(turn_rate-0.10);
  }
  else if (currentlyPressedKeys["w"]){
    amount_pitch = amount_pitch + degToRad(turn_rate-0.10);
  }
  else if (currentlyPressedKeys["d"]){
    amount_roll = amount_roll + degToRad(turn_rate);
  }
  else if (currentlyPressedKeys["a"]){
    amount_roll = amount_roll - degToRad(turn_rate);
  }
  else if (currentlyPressedKeys["z"]){
      plane_speed = plane_speed - speed_increments;
    //  console.log(plane_speed);
  }
  else if (currentlyPressedKeys["x"]){
  //  console.log(plane_speed);
  // stop the plane from going backwards
    if(plane_speed < min_speed){
    plane_speed = plane_speed + speed_increments;
    }
  }

  // CODE FOR PITCHING //
  glMatrix.vec3.cross(cross_product_vec3, viewDir, up);
  glMatrix.quat.setAxisAngle(rot_quat, cross_product_vec3, amount_pitch);
  glMatrix.vec3.transformQuat(up, up, rot_quat);
  glMatrix.vec3.transformQuat(viewDir, viewDir, rot_quat);

  // CODE FOR ROLLING //
  glMatrix.quat.setAxisAngle(rot_quat, viewDir, amount_roll);
  glMatrix.vec3.transformQuat(up, up, rot_quat);
  glMatrix.vec3.transformQuat(viewDir, viewDir, rot_quat);

  //CODE FOR SPEED INCREASE //
  glMatrix.vec3.scale(movement_vec3, viewDir, plane_speed);
  glMatrix.vec3.add(transformVec, transformVec, movement_vec3);
}

//Array to handle user interaction
var currentlyPressedKeys = {};

//----------------------------------------------------------------------------------
/**
 * Function called to mark KeyDown as true
 * @param {listener} event listens from key presses
 */
function handleKeyDown(event) {
  if (event.key == "w" || event.key == "a"){
    event.preventDefault();
  }
  if (event.key == "s" || event.key == "d"){
    event.preventDefault();
  }
  if (event.key == "z" || event.key == "x"){
    event.preventDefault();
  }
  currentlyPressedKeys[event.key] = true;
}

//----------------------------------------------------------------------------------
/**
 * Function called to mark KeyUp as false
 * @param {listener} event listens from key presses
 */
function handleKeyUp(event) {
  currentlyPressedKeys[event.key] = false;
}

//----------------------------------------------------------------------------------
/**
 * Function called to run animation by calling requestAnimationFrame on itself and flight_animate
 */
function tick() {
  flight_animate();
  draw();
  requestAnimationFrame(tick);
}

//----------------------------------------------------------------------------------
/**
 * Function called to enable and disable fog by setting the fog_boolean variable
 */
function FogFunction(){
  if(fog_boolean == 0){
    console.log("fog clicked!");
    fog_boolean = 1;
  }
  else if (fog_boolean == 1){
    console.log("fog unclicked!");
    fog_boolean = 0;
  }
  // pass fog_boolean value to shaderProgram to then pass into my HTML script
  gl.uniform1i(shaderProgram.uniform_fog, fog_boolean);
}
//----------------------------------------------------------------------------------
/**
 * Startup function called from html code to start program.
 */
 function startup() {
  canvas = document.getElementById("myGLCanvas");
  gl = createGLContext(canvas);

  setupShaders();
  setupBuffers();

  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.enable(gl.DEPTH_TEST);

  document.onkeydown = handleKeyDown;
  document.onkeyup = handleKeyUp;

  // run our flight animation
  tick();
}
