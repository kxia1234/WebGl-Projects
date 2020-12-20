
/**
 * @file A simple WebGL example drawing MP3
 * @author Kevin Xia <kevinx3@illinois.edu>
 * @author Eric Shaffer <shaffer1@illinois.edu>
 */

// MP3 New Variable //
/** @global A simple GLSL shader program for the cubemap */
var cubemapProgram;

/** @global The View matrix */
var viewMatrix = glMatrix.mat4.create();

/** @global The Inverse matrix for Reflection */
var inverseMatrix = glMatrix.mat4.create();

/** @global world array */
var world_s = [];

/** @global orbit values for animation */
var x_value = 15; // for x rotation
var y_value = 30; // for y rotation

/** @global An object holding the geometry for a 3D mesh (teapot) */
var myMesh;

/** @global An object holding the geometry for a 3D mesh (cubemap) */
var myCubeMap;

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

// View parameters
/** @global Location of the camera in world coordinates */
var eyePt = glMatrix.vec3.fromValues(0.3, 1.5, 16.0);
/** @global Direction of the view in world coordinates */
var viewDir = glMatrix.vec3.fromValues(0.0,0,-1.0);
/** @global Up vector for view matrix creation, in world coordinates */
var up = glMatrix.vec3.fromValues(0.0, 2.0, 0.0);
/** @global Location of a point along viewDir in world coordinates */
var viewPt = glMatrix.vec3.fromValues(0.0, 0.0, 0.0);

//Light parameters
/** @global Light position in VIEW coordinates */
var lightPosition = [0, 0, 0];
/** @global Ambient light color/intensity for Phong reflection */
var lAmbient = [1, 1, 1];
/** @global Diffuse light color/intensity for Phong reflection */
var lDiffuse = [1, 1, 1];
/** @global Specular light color/intensity for Phong reflection */
var lSpecular = [1, 1, 1];

//Material parameters
/** @global Ambient material color/intensity for Phong reflection */
var kAmbient = [0.0, 0.0, 0.0];
/** @global Diffuse material color/intensity for Phong reflection */
var kTerrainDiffuse = [205.0/255.0,163.0/255.0,63.0/255.0];
/** @global Specular material color/intensity for Phong reflection */
var kSpecular = [1.0,1.0,1.0];
/** @global Shininess exponent for Phong reflection */
var shininess = 23;
/** @global Edge color fpr wireframeish rendering */
var kEdgeBlack = [0.0, 0.0, 0.0];
/** @global Edge color for wireframe rendering */
var kEdgeWhite = [1.0, 1.0, 1.0];


//-------------------------------------------------------------------------
/**
 * Sends Modelview matrix to shader
 */
function uploadModelViewMatrixToShader() {
  gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
  gl.uniformMatrix4fv(shaderProgram.inverseMatrixUniform, false, inverseMatrix); //add in inverse for proper reflection
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
  glMatrix.mat3.fromMat4(nMatrix, mvMatrix);
  glMatrix.mat3.transpose(nMatrix, nMatrix);
  glMatrix.mat3.invert(nMatrix, nMatrix);
  gl.uniformMatrix3fv(shaderProgram.nMatrixUniform, false, nMatrix);
}

//----------------------------------------------------------------------------------
/**
 * Sends projection/modelview matrices to shader
 */
function setMatrixUniforms() {
  gl.useProgram(shaderProgram);
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
  vertexShader = loadShaderFromDOM("teapot-vs");
  fragmentShader = loadShaderFromDOM("teapot-fs");

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
  shaderProgram.uniformDiffuseMaterialColorLoc = gl.getUniformLocation(shaderProgram, "ushaderDiffuse");
  shaderProgram.uniformSpecularMaterialColorLoc = gl.getUniformLocation(shaderProgram, "uKSpecular");
    
  shaderProgram.uniformModeLoc = gl.getUniformLocation(shaderProgram, "shader_select");
  shaderProgram.inverseMatrixUniform = gl.getUniformLocation(shaderProgram, "uinverseMatrix");
   
 // Load Shaders for Cubemap //
  vertexShader = loadShaderFromDOM("cubemap-vs");
  fragmentShader = loadShaderFromDOM("cubemap-fs");

  cubemapProgram = gl.createProgram();
  gl.attachShader(cubemapProgram, vertexShader);
  gl.attachShader(cubemapProgram, fragmentShader);
  gl.linkProgram(cubemapProgram);

  if (!gl.getProgramParameter(cubemapProgram, gl.LINK_STATUS)) {
    alert("Failed to setup shaders");
  }

  gl.useProgram(cubemapProgram);

  cubemapProgram.vertexPositionAttribute = gl.getAttribLocation(cubemapProgram, "aVertexPosition");
  gl.enableVertexAttribArray(cubemapProgram.vertexPositionAttribute);
    
  cubemapProgram.mvMatrixUniform = gl.getUniformLocation(cubemapProgram, "uMVMatrix");
  cubemapProgram.pMatrixUniform = gl.getUniformLocation(cubemapProgram, "uPMatrix");
}

//-------------------------------------------------------------------------
/**
 * Sends material information to the shader
 * @param {Float32} alpha shininess coefficient
 * @param {Float32Array} a Ambient material color
 * @param {Float32Array} d Diffuse material color
 * @param {Float32Array} s Specular material color
 */
function setMaterialUniforms(alpha, a, d, s) {
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
function setLightUniforms(loc, a, d, s) {
  gl.uniform3fv(shaderProgram.uniformLightPositionLoc, loc);
  gl.uniform3fv(shaderProgram.uniformAmbientLightColorLoc, a);
  gl.uniform3fv(shaderProgram.uniformDiffuseLightColorLoc, d);
  gl.uniform3fv(shaderProgram.uniformSpecularLightColorLoc, s);
}

//----------------------------------------------------------------------------------
/**
 * Draw call that applies matrix transformations to model and draws model in frame
 */
function draw() {
  gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // We'll use perspective 
  glMatrix.mat4.perspective(pMatrix, degToRad(45),
    gl.viewportWidth / gl.viewportHeight,
    0.1, 500.0);

    // We want to look down -z, so create a lookat point in that direction
    glMatrix.vec3.add(viewPt, eyePt, viewDir);
    // Then generate the lookat matrix and initialize the MV matrix to that view
    glMatrix.mat4.lookAt(mvMatrix,eyePt,viewPt,up);

  // Fix my light position to produce proper phong shading // 
  lightPosition = [10, 5, 20];

  if (myMesh.loaded()) {
    glMatrix.mat4.rotateX(mvMatrix, mvMatrix, degToRad(x_value));
    glMatrix.mat4.rotateY(mvMatrix, mvMatrix, degToRad(y_value));
    glMatrix.mat4.multiply(mvMatrix, viewMatrix, mvMatrix);
    glMatrix.mat4.invert(inverseMatrix, mvMatrix);
    glMatrix.vec3.transformMat4(lightPosition, lightPosition, mvMatrix);
    setMatrixUniforms();
    setLightUniforms(lightPosition, lAmbient, lDiffuse, lSpecular);
      
    // Change Shading if Selected //
    if ((document.getElementById("phong").checked)){
         gl.uniform1i(shaderProgram.uniformModeLoc, 1);

    }
    if ((document.getElementById("reflective").checked)){
         gl.uniform1i(shaderProgram.uniformModeLoc, 2);
    }
    if ((document.getElementById("refractive").checked)){
         gl.uniform1i(shaderProgram.uniformModeLoc, 3);
    }

    if ((document.getElementById("polygon").checked) || (document.getElementById("wirepoly").checked)) {
      setMaterialUniforms(shininess,kAmbient,kTerrainDiffuse,kSpecular);
      myMesh.drawTriangles();
    }

    if (document.getElementById("wirepoly").checked) {
      setMaterialUniforms(shininess,kAmbient,kEdgeBlack,kSpecular);
      myMesh.drawEdges();
    }

    if (document.getElementById("wireframe").checked) {
      setMaterialUniforms(shininess,kAmbient,kEdgeWhite,kSpecular);
      myMesh.drawEdges();
    }

    //  requestAnimationFrame(draw); <- calling requestAnimationFrame through tick() function now


    // Draw Skybox
  gl.useProgram(cubemapProgram);
  gl.uniformMatrix4fv(cubemapProgram.mvMatrixUniform, false, mvMatrix);
  gl.uniformMatrix4fv(cubemapProgram.pMatrixUniform, false, pMatrix);    
  myCubeMap.drawTriangles();
  }

}

//----------------------------------------------------------------------------------
/**
 * Function to swap between cubemaps
 */
function changeCube(){
    if (document.getElementById("default").checked) {
  setupTexture();
}
if (document.getElementById("custom").checked) {
  setupTexture2();
}
}

//----------------------------------------------------------------------------------
/**
 * Startup function called from html code to start program.
 */
function startup() {
  canvas = document.getElementById("myGLCanvas");
  gl = createGLContext(canvas);
    
  // Setup Shaders (Skybox and Teapot) //  
  setupShaders();

  // Create My Cube Map //
  myCubeMap = new CubeMap(200);
  setupTexture();
    
  // Render the Teapot //
  setupMesh("teapot.obj");
    
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.enable(gl.DEPTH_TEST);
    
  // Have Key Controls //
  document.onkeydown = handleKeyDown;
  document.onkeyup = handleKeyUp;

  // run our animation
  tick();
}

//----------------------------------------------------------------------------------
/**
 * Populate buffers with data (From Reading an OBJ File PDF)
 * @param {string} filename for obj
 */
function setupMesh(filename) {
  //Your code here
  myMesh = new TriMesh();
  myPromise = asyncGetFile(filename);
  // We define what to do when the promise is resolved with the then() call,
  // and what to do when the promise is rejected with the catch() clal
  myPromise.then((retrivedText) => {
    myMesh.loadFromOBJ(retrivedText);
    console.log("Yay! got the file");
  })
    .catch(
      // Log the rejection reason
      (reason) => {
      console.log('Handle rejected promise (' + reason + ') here.');
    });
}

//----------------------------------------------------------------------------------
/**
  * Animate call that produces the animation for teapot orbit
  */
function animate() {

 var speed_value = 0.2;
 if (currentlyPressedKeys["s"]){
    x_value= x_value + speed_value;
  }
  else if (currentlyPressedKeys["w"]){
    x_value= x_value - speed_value;
  }
  else if (currentlyPressedKeys["d"]){
    y_value= y_value + speed_value;
  }
  else if (currentlyPressedKeys["a"]){
    y_value= y_value - speed_value;
  }

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
//  if (event.key == "z" || event.key == "x"){
//    event.preventDefault();
//  }
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
  animate();
  draw();
  requestAnimationFrame(tick);
}


/**
 * Setup texture for London Cubemap (copied https://webglfundamentals.org/webgl/lessons/webgl-environment-maps.html)
 */
function setupTexture() {
  // Create a texture.
  var texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);

  const faceInfos = [
    {
      target: gl.TEXTURE_CUBE_MAP_POSITIVE_X,
      url: 'skybox_images/default/pos-x.png',
    },
    {
      target: gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
      url: 'skybox_images/default/neg-x.png',
    },
    {
      target: gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
      url: 'skybox_images/default/pos-y.png',
    },
    {
      target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
      url: 'skybox_images/default/neg-y.png',
    },
    {
      target: gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
      url: 'skybox_images/default/pos-z.png',
    },
    {
      target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z,
      url: 'skybox_images/default/neg-z.png',
    },
  ];
  faceInfos.forEach((faceInfo) => {
    const {target, url} = faceInfo;

    // Upload the canvas to the cubemap face.
    const level = 0;
    const internalFormat = gl.RGBA;
    const width = 512;
    const height = 512;
    const format = gl.RGBA;
    const type = gl.UNSIGNED_BYTE;

    // setup each face so it's immediately renderable
    gl.texImage2D(target, level, internalFormat, width, height, 0, format, type, null);

    // Asynchronously load an image
    const image = new Image();
    image.src = url;
    image.addEventListener('load', function () {
      // Now that the image has loaded upload it to the texture.
      gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
      gl.texImage2D(target, level, internalFormat, format, type, image);
      gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
    });
  });
  gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
}

/**
 * Setup texture for Gym Cubemap (copied https://webglfundamentals.org/webgl/lessons/webgl-environment-maps.html)
 */
function setupTexture2() {
  // Create a texture.
  var texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);

  const faceInfos = [
    {
      target: gl.TEXTURE_CUBE_MAP_POSITIVE_X,
      url: 'skybox_images/personal/px.jpg',
    },
    {
      target: gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
      url: 'skybox_images/personal/nx.jpg',
    },
    {
      target: gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
      url: 'skybox_images/personal/py.jpg',
    },
    {
      target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
      url: 'skybox_images/personal/ny.jpg',
    },
    {
      target: gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
      url: 'skybox_images/personal/pz.jpg',
    },
    {
      target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z,
      url: 'skybox_images/personal/nz.jpg',
    },
  ];
  faceInfos.forEach((faceInfo) => {
    const { target, url } = faceInfo;

    // Upload the canvas to the cubemap face.
    const level = 0;
    const internalFormat = gl.RGBA;
    const width = 512;
    const height = 512;
    const format = gl.RGBA;
    const type = gl.UNSIGNED_BYTE;

    // setup each face so it's immediately renderable
    gl.texImage2D(target, level, internalFormat, width, height, 0, format, type, null);

    // Asynchronously load an image
    const image = new Image();
    image.src = url;
    image.addEventListener('load', function () {
      // Now that the image has loaded upload it to the texture.
      gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
      gl.texImage2D(target, level, internalFormat, format, type, image);
      gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
    });
  });
  gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
}


//-------------------------------------------------------------------------
/**
 * Asynchronously read a server-side text file (From Reading an OBJ File PDF)
 * @param {listener} url for file
 */
function asyncGetFile(url) {
  //Your code here
  console.log("Getting text file");
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", url);
    xhr.onload = () => resolve(xhr.responseText);
    xhr.onerror = () => reject(xhr.statusText);
    xhr.send();
    console.log("Made promise");
  });

}