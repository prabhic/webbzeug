window.Webbzeug ?= {}
window.Webbzeug.Actions ?= {}
window.Webbzeug.Actions.Rectangle = class RectangleAction extends Webbzeug.Action
  type: 'rectangle'
  name: 'Rect'
  availableParameters: ->
    {
      x: { name: 'X', type: 'integer', min: 0, max: 256, default: 64, scrollPrecision: 1 },
      y:  { name: 'Y', type: 'integer', min: 0, max: 256, default: 64, scrollPrecision: 1 },
      width:  { name: 'Width', type: 'integer', min: 0, max: 256, default: 128, scrollPrecision: 1 },
      height:  { name: 'Height', type: 'integer', min: 0, max: 256, default: 128, scrollPrecision: 1 }
      color: { name: 'Color', type: 'color', default: 'rgba(255,255,255,1)' }
    }

  validations: (contexts) ->
    warnings = []
    if contexts.length > 1
      warnings.push 'Rectangle will only use the first input.'
  
    return { warnings: warnings }

  render: (textures) ->
    #super()
    ###
    x = @getParameter('x')
    y = @getParameter('y')
    w = @getParameter('width')
    h = @getParameter('height')

    console.log "rendering", x, y, w, h

    @copyRendered contexts

    @context.fillStyle = @getParameter('color')
    @context.fillRect x, y, w, h
    ###
    
    gl = @app.getWebGLContext()
     
    gl.bindTexture(gl.TEXTURE_2D, null)


    #// setup GLSL program
    vertexShader = @loadShader(gl, "attribute vec2 a_position; uniform vec2 u_resolution; void main() { vec2 zeroToOne = a_position / u_resolution; vec2 zeroToTwo = zeroToOne * 2.0; vec2 clipSpace = zeroToTwo - 1.0; gl_Position = vec4(clipSpace, 0, 1);   }", 
    gl.VERTEX_SHADER)
    
    fragmentShader = @loadShader(gl, "void main() { gl_FragColor = vec4(0,1,0,1); }", 
    gl.FRAGMENT_SHADER)
    
    program = createProgram(gl, [vertexShader, fragmentShader])
    gl.useProgram(program)

    #// look up where the vertex data needs to go.
    positionLocation = gl.getAttribLocation(program, "a_position")

    #// set the resolution
    resolutionLocation = gl.getUniformLocation(program, "u_resolution")
    # @canvas.width = @app.getWidth()
    #@canvas.height = @app.getHeight()
    gl.uniform2f(resolutionLocation, @app.getWidth(), @app.getHeight())

    #// Create a buffer and put a single clipspace rectangle in
    #// it (2 triangles)
    buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
       10, 20,
       80, 20,
       10, 30,
       10, 30,
       80, 20,
       80, 30]),  gl.STATIC_DRAW)
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0)

    @app.setFramebuffer(null, @app.getWidth, @app.getHeight)
    gl.clearColor(1.0, 1.0, 0.0, 1.0)
    #// draw
    gl.drawArrays(gl.TRIANGLES, 0, 6)
    console.log "done"
    return @texture