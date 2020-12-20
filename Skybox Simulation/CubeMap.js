/**
 * @fileoverview CubeMap - A simple 3D CubeMap mesh for use with WebGL
 * @author Eric Shaffer
 * @author Kevin Xia
 */

class CubeMap {
  /**
   * Construct Variables for My CubeMap
   * @param {int} size of cubemap to create or the length of the cube "side"
   */
  constructor(side_length) {
    this.side_length = side_length;

    // Create my vBuffer //
    this.vBuffer = [
      -this.side_length, -this.side_length, this.side_length,
      this.side_length, -this.side_length, this.side_length,
      this.side_length, this.side_length, this.side_length,
      -this.side_length, this.side_length, this.side_length,
      -this.side_length, -this.side_length, -this.side_length,
      this.side_length, -this.side_length, -this.side_length,
      this.side_length, this.side_length, -this.side_length,
      -this.side_length, this.side_length, -this.side_length,
    ];    
      
    // Create my fBuffer //
    this.fBuffer = [];

    // Generate my CubeMap Triangles //
    this.generateTriangles(); 

    // Get extension for 4 byte integer indices for drawElements (copied from TriMesh.js)
    var ext = gl.getExtension('OES_element_index_uint');
    if (ext ==null){
        alert("OES_element_index_uint is unsupported by your browser and terrain generation cannot proceed.");
    }
    else{
        console.log("OES_element_index_uint is supported!");
    }
  }

  /**
   * Generate Triangles for My CubeMap
   */
  generateTriangles() {
    // got these indicies from https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Creating_3D_objects_using_WebGL and adjusted some to work well //
    // essentially, each face is two triangles and we can use each indice in the vertex array to isolate each position of the triangle //
    const triangle_indices = [
        0,  1,  2,  0,  3,  2,    // Front Face
        4,  5,  6,  4,  7,  6,    // Back Face
        3,  2,  6,  3,  7,  6,    // Top Face
        0,  1,  5,  0,  4,  5,    // Bottom Face
        2,  1,  5,  2,  6,  5,    // Right Face
        4,  0,  3,  4,  7,  3,    // Left Face
    ];

    // push my indices to the buffer //
    for (var j = 0; j < this.side_length *2; j++) {
      this.fBuffer.push(triangle_indices[j]);
    }

    // load my buffers //
    this.loadBuffers();
  }

  /**
    * Load Buffers for My CubeMap
    * Send the buffer objects to WebGL for rendering (copied from TriMesh.js)
    */
  loadBuffers() {
    this.VertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vBuffer), gl.STATIC_DRAW);
    this.VertexPositionBuffer.itemSize = 3;
    this.VertexPositionBuffer.numItems = this.numVertices;
    console.log("Loaded ", this.VertexPositionBuffer.numItems, " vertices");

    this.IndexTriBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.IndexTriBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(this.fBuffer),
                  gl.STATIC_DRAW);
    this.IndexTriBuffer.itemSize = 1;
    this.IndexTriBuffer.numItems = this.fBuffer.length;
    console.log("Loaded ", this.IndexTriBuffer.numItems / 3, " triangles");
  }

  /**
    * Draw Triangles for My CubeMap 
    * Render the triangles (copied from TriMesh.js)
    */
  drawTriangles() {
    gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexPositionBuffer);
    gl.vertexAttribPointer(cubemapProgram.vertexPositionAttribute, this.VertexPositionBuffer.itemSize,
                  gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.IndexTriBuffer);
    gl.drawElements(gl.TRIANGLES, this.IndexTriBuffer.numItems, gl.UNSIGNED_INT, 0);
      
    mvMatrix = world_s.pop();
  }
}

