/**
 * @fileoverview Terrain - A simple 3D terrain using WebGL
 * @author Kevin Xia <kevinx3@illinois.edu>
 * @author Eric Shaffer <shaffer1@illinois.edu>
 */

 /** Class implementing 3D terrain. */
 class Terrain{
 /**
  * Initialize members of a Terrain object
  * @param {number} div Number of triangles along x axis and y axis
  * @param {number} minX Minimum X coordinate value
  * @param {number} maxX Maximum X coordinate value
  * @param {number} minY Minimum Y coordinate value
  * @param {number} maxY Maximum Y coordinate value
  */
     constructor(div,minX,maxX,minY,maxY){
         this.div = div;
         this.minX=minX;
         this.minY=minY;
         this.maxX=maxX;
         this.maxY=maxY;

         // Allocate vertex array
         this.vBuffer = [];
         // Allocate triangle array
         this.fBuffer = [];
         // Allocate normal array
         this.nBuffer = [];
         // Allocate array for edges so we can draw wireframe
         this.eBuffer = [];
         console.log("Terrain: Allocated buffers");

         this.generateTriangles();
         console.log("Terrain: Generated triangles");

         this.generateLines();
         console.log("Terrain: Generated lines");

         // Get extension for 4 byte integer indices for drwElements
         var ext = gl.getExtension('OES_element_index_uint');
         if (ext ==null){
             alert("OES_element_index_uint is unsupported by your browser and terrain generation cannot proceed.");
         }
     }

   /**
   * Set the x,y,z coords of a vertex at location(i,j)
   * @param {Object} v an an array of length 3 holding x,y,z coordinates
   * @param {number} i the ith row of vertices
   * @param {number} j the jth column of vertices
   */
  setVertex(v, i, j) {
    var vid_idx = (i * (this.div + 1) + j) * 3;
    this.vBuffer[vid_idx] = v[0];
    this.vBuffer[vid_idx + 1] = v[1];
    this.vBuffer[vid_idx + 2] = v[2];
  }

  /**
  * Return the x,y,z coordinates of a vertex at location (i,j)
  * @param {Object} v an an array of length 3 holding x,y,z coordinates
  * @param {number} i the ith row of vertices
  * @param {number} j the jth column of vertices
  */
  getVertex(v, i, j) {
    var vid_idx = (i * (this.div + 1) + j) * 3;
    v[0] = this.vBuffer[vid_idx];
    v[1] = this.vBuffer[vid_idx + 1];
    v[2] = this.vBuffer[vid_idx + 2];
  }

  /**
  * Send the buffer objects to WebGL for rendering
  */
  loadBuffers()
  {
      // Specify the vertex coordinates
      this.VertexPositionBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexPositionBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vBuffer), gl.STATIC_DRAW);
      this.VertexPositionBuffer.itemSize = 3;
      this.VertexPositionBuffer.numItems = this.numVertices;
      console.log("Loaded ", this.VertexPositionBuffer.numItems, " vertices");

      // Specify normals to be able to do lighting calculations
      this.VertexNormalBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexNormalBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.nBuffer),
                gl.STATIC_DRAW);
      this.VertexNormalBuffer.itemSize = 3;
      this.VertexNormalBuffer.numItems = this.numVertices;
      console.log("Loaded ", this.VertexNormalBuffer.numItems, " normals");

      // Specify faces of the terrain
      this.IndexTriBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.IndexTriBuffer);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(this.fBuffer),
                gl.STATIC_DRAW);
      this.IndexTriBuffer.itemSize = 1;
      this.IndexTriBuffer.numItems = this.fBuffer.length;
      console.log("Loaded ", this.IndexTriBuffer.numItems, " triangles");

      //Setup Edges
      this.IndexEdgeBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.IndexEdgeBuffer);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(this.eBuffer),
                gl.STATIC_DRAW);
      this.IndexEdgeBuffer.itemSize = 1;
      this.IndexEdgeBuffer.numItems = this.eBuffer.length;

      console.log("triangulatedPlane: loadBuffers");
  }

  /**
  * Render the triangles
  */
  drawTriangles(){
      gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexPositionBuffer);
      gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, this.VertexPositionBuffer.itemSize,
                       gl.FLOAT, false, 0, 0);

      // Bind normal buffer
      gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexNormalBuffer);
      gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute,
                         this.VertexNormalBuffer.itemSize,
                         gl.FLOAT, false, 0, 0);

      //Draw
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.IndexTriBuffer);
      gl.drawElements(gl.TRIANGLES, this.IndexTriBuffer.numItems, gl.UNSIGNED_INT,0);
  }

  /**
  * Render the triangle edges wireframe style
  */
  drawEdges(){

      gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexPositionBuffer);
      gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, this.VertexPositionBuffer.itemSize,
                       gl.FLOAT, false, 0, 0);

      // Bind normal buffer
      gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexNormalBuffer);
      gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute,
                         this.VertexNormalBuffer.itemSize,
                         gl.FLOAT, false, 0, 0);

      //Draw
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.IndexEdgeBuffer);
      gl.drawElements(gl.LINES, this.IndexEdgeBuffer.numItems, gl.UNSIGNED_INT,0);
  }

/**
 * Fill the vertex and buffer arrays
 */
generateTriangles() {
  var deltaX = (this.maxX - this.minX) / this.div;
  var deltaY = (this.maxY - this.minY) / this.div;

  for (var i = 0; i <= this.div; i++) {
    for (var j = 0; j <= this.div; j++) {
      this.vBuffer.push(this.minX+deltaX*j);
      this.vBuffer.push(this.minY+deltaY*i);
      this.vBuffer.push(0);

      this.nBuffer.push(0);
      this.nBuffer.push(0);
      this.nBuffer.push(0);
    }
  }

  for (var i = 0; i < this.div; i++) {
    for (var j = 0; j < this.div; j++) {
      var vid = i * (this.div + 1) + j;
      this.fBuffer.push(vid);
      this.fBuffer.push(vid+1);
      this.fBuffer.push(vid+this.div+1);

      this.fBuffer.push(vid+1);
      this.fBuffer.push(vid+1+this.div+1);
      this.fBuffer.push(vid+this.div+1);
    }
  }

  this.numVertices = this.vBuffer.length / 3;
  this.numFaces = this.fBuffer.length / 3;
  this.produceVertices(230, 0.0037);
  this.produceNormals();
  this.calculateZ();
}

/**
 * Calculate the Min Z and Max Z values for Shaders
 */
calculateZ() {
  this.shader_maxZ = -Infinity;
  this.shader_minZ = Infinity;
  for (var i = 0; i < this.numVertices; i++) {
    var temp_h =  this.vBuffer[3 * i + 2];
    if (temp_h  < this.shader_minZ){
      this.shader_minZ = temp_h ;
    }
    if (temp_h  > this.shader_maxZ){
      this.shader_maxZ = temp_h ;
    }
  }
}

/**
 * Randomly generate our plane by producing vertices
 * @param {number} iterations the number of iterations
 * @param {number} delta the delta value
 */
produceVertices(iterations, delta) {
  for (var i = 0; i < iterations; i++) {
    var rand_normal = glMatrix.vec2.create();
    var point_x = this.maxX - this.minX;
    var point_y = this.maxY - this.minY;
    var rand_point = [(Math.random() * point_x) + this.minX, (Math.random() * point_y) + this.minY];
    glMatrix.vec2.random(rand_normal);

    for (var j = 0; j < this.numVertices; j++) {
      var buffer = [this.vBuffer[j * 3], this.vBuffer[j * 3 + 1]];
      var temp_vertix_0 = (buffer[0] * rand_normal[0] - rand_normal[0] * rand_point[0]);
      var temp_vertix_1 = (buffer[1] * rand_normal[1] - rand_normal[1] * rand_point[1]);
      if (temp_vertix_0 + temp_vertix_1 > 0) {
        this.vBuffer[j * 3 + 2] += delta;
      }
      else {
        this.vBuffer[j * 3 + 2] -= delta;
      }
    }
  }
}

/**
 * Produce the normals for the generated mesh
 */
produceNormals() {
  for (var i = 0; i < this.numFaces; i++) {
    var norm_vec = glMatrix.vec3.create();
    var temp_vec = glMatrix.vec3.create();
    var temp_vec_2 = glMatrix.vec3.create();

    var vertix_0 = [this.vBuffer[this.fBuffer[i * 3] * 3], this.vBuffer[this.fBuffer[i * 3] * 3 + 1], this.vBuffer[this.fBuffer[i * 3]* 3 + 2]];
    var vertix_1 = [this.vBuffer[this.fBuffer[i * 3 + 1] * 3], this.vBuffer[this.fBuffer[i * 3 + 1] * 3 + 1], this.vBuffer[this.fBuffer[i * 3 + 1] * 3 + 2]];
    var vertix_3 = [this.vBuffer[this.fBuffer[i * 3 + 2] * 3], this.vBuffer[this.fBuffer[i * 3 + 2] * 3 + 1], this.vBuffer[this.fBuffer[i * 3 + 2] * 3 + 2]];

    var norm_0 = [this.nBuffer[this.fBuffer[i * 3] * 3], this.nBuffer[this.fBuffer[i * 3] * 3 + 1], this.nBuffer[this.fBuffer[i * 3] * 3 + 2]];
    var norm_1 = [this.nBuffer[this.fBuffer[i * 3 + 1] * 3], this.nBuffer[this.fBuffer[i * 3 + 1] * 3 + 1], this.nBuffer[this.fBuffer[i * 3 + 1] * 3 + 2]];
    var norm_2 = [this.nBuffer[this.fBuffer[i * 3 + 2] * 3], this.nBuffer[this.fBuffer[i * 3 + 2] * 3 + 1], this.nBuffer[this.fBuffer[i * 3 + 2] * 3 + 2]];

    glMatrix.vec3.sub(temp_vec, vertix_1, vertix_0);
    glMatrix.vec3.sub(temp_vec_2, vertix_3, vertix_0);

    glMatrix.vec3.cross(norm_vec, temp_vec, temp_vec_2);
    glMatrix.vec3.add(norm_0, norm_0, norm_vec);
    glMatrix.vec3.add(norm_1, norm_1, norm_vec);
    glMatrix.vec3.add(norm_2, norm_2, norm_vec);

    [this.nBuffer[this.fBuffer[i * 3] * 3], this.nBuffer[this.fBuffer[i * 3] * 3 + 1], this.nBuffer[this.fBuffer[i * 3] * 3 + 2]] = norm_0;
    [this.nBuffer[this.fBuffer[i * 3 + 1] * 3], this.nBuffer[this.fBuffer[i * 3 + 1] * 3 + 1], this.nBuffer[this.fBuffer[i * 3 + 1] * 3 + 2]] = norm_1;
    [this.nBuffer[this.fBuffer[i * 3 + 2] * 3], this.nBuffer[this.fBuffer[i * 3 + 2] * 3 + 1], this.nBuffer[this.fBuffer[i * 3 + 2] * 3 + 2]] = norm_2;
  }

  for (var j = 0; j < this.numVertices; j++) {
    glMatrix.vec3.normalize([this.nBuffer[j * 3], this.nBuffer[j * 3 + 1], this.nBuffer[j * 3 + 2]], [this.nBuffer[j * 3], this.nBuffer[j * 3 + 1], this.nBuffer[j * 3 + 2]]);
    [this.nBuffer[j * 3], this.nBuffer[j * 3 + 1], this.nBuffer[j * 3 + 2]] = [this.nBuffer[j * 3], this.nBuffer[j * 3 + 1], this.nBuffer[j * 3 + 2]];
  }
}

/**
 * Print vertices and triangles to console for debugging
 */
printBuffers()
    {

    for(var i=0;i<this.numVertices;i++)
          {
           console.log("v ", this.vBuffer[i*3], " ",
                             this.vBuffer[i*3 + 1], " ",
                             this.vBuffer[i*3 + 2], " ");

          }

      for(var i=0;i<this.numFaces;i++)
          {
           console.log("f ", this.fBuffer[i*3], " ",
                             this.fBuffer[i*3 + 1], " ",
                             this.fBuffer[i*3 + 2], " ");

          }

    }

/**
 * Generates line values from faces in faceArray
 * to enable wireframe rendering
 */
generateLines()
{
    var numTris=this.fBuffer.length/3;
    for(var f=0;f<numTris;f++)
    {
        var fid=f*3;
        this.eBuffer.push(this.fBuffer[fid]);
        this.eBuffer.push(this.fBuffer[fid+1]);

        this.eBuffer.push(this.fBuffer[fid+1]);
        this.eBuffer.push(this.fBuffer[fid+2]);

        this.eBuffer.push(this.fBuffer[fid+2]);
        this.eBuffer.push(this.fBuffer[fid]);
    }

}

}
