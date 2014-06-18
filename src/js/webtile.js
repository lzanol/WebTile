function Utils() {}

Utils.createDelegate = function(scope, fn) {
	return function() {
		return fn.apply(scope, arguments)
	}
}

// inheritance - http://stackoverflow.com/questions/14564155/javascript-prototypal-inheritance-descendants-override-each-other/14576273#14576273
Utils.inherit = function(subClass, superClass) {
	var T = function(){}
	T.prototype = superClass.prototype
	subClass.prototype = new T()
	subClass.prototype.constructor = subClass
}

Utils.preloadImages = function(paths, callback) {
	var imgs = [],
		img, tid, i

	callback = callback || function(){}

	for (i = 0; i < paths.length; ++i) {
		imgs.push(img = new Image())
		img.src = paths[i]
	}

	tid = setInterval(function() {
		for (i = 0; i < imgs.length; ++i)
			if (imgs[i].complete == false)
				return

		clearInterval(tid)
		callback()
	}, 200)
}

function Point(x_obj, y) {
	if (x_obj instanceof Point) {
		this.x = x_obj.x
		this.y = x_obj.y
	}
	else {
		this.x = !isNaN(x_obj) ? x_obj : 0.0
		this.y = !isNaN(y) ? y : 0.0
	}
}

Point.prototype.x = NaN
Point.prototype.y = NaN

Point.prototype.equals = function(p) {
	return this.x == p.x && this.y == p.y
}

Point.prototype.toString = function() {
	return "{x:" + this.x + ", y:" + this.y + "}"
}

function Time() {
	this.reset()
}

Time.prototype.ti = 0

Time.prototype.reset = function() {
	this.ti = (new Date()).getTime()
}

Time.prototype.getCurrentMs = function() {
	return (new Date()).getTime() - this.ti
}

Time.prototype.getCurrent = function() {
	return this.getCurrentMs()*.001
}

function VisualObj() {
	VisualObj.instances.push(this)

	this.shape = document.createElement("div")
	this.shape.style.position = "absolute"
	this.pos = new Point()
	this.posLast = new Point()
	this.size = new Point()
	this.sizeHalf = new Point()
	this.indexes = new Point()
	this.time = new Time()

	var i,vot,inst

	if (isNaN(VisualObj.updateId))
		VisualObj.updateId = setInterval(function() {
			vot = VisualObj.instances.length

			for (i = 0; i < vot; ++i)
				Utils.createDelegate(inst = VisualObj.instances[i], inst.onUpdate)()
		}, 1000/VisualObj.FPS)
}

VisualObj.TILE_SIZE = 30
VisualObj.FPS = 50

VisualObj.updateId = NaN
VisualObj.instances = []

VisualObj.prototype.shape = null
VisualObj.prototype.pos = null
VisualObj.prototype.posLast = null
VisualObj.prototype.size = null
VisualObj.prototype.sizeHalf = null
VisualObj.prototype.indexes = null
VisualObj.prototype.time = null
VisualObj.prototype.onUpdate = function() {}

VisualObj.prototype.setPos = function(pos) {
	this.shape.style.left = (pos.x - this.sizeHalf.x) + "px"
	this.shape.style.top = (pos.y - this.sizeHalf.y) + "px"

	this.posLast.x = this.pos.x
	this.posLast.y = this.pos.y
	this.pos.x = pos.x
	this.pos.y = pos.y
}

VisualObj.prototype.getPos = function() {
	return new Point(this.pos)
}

VisualObj.prototype.setSize = function(size) {
	this.shape.style.width = size.x + "px"
	this.shape.style.height = size.y + "px"
	this.size.x = size.x
	this.size.y = size.y
	this.sizeHalf.x = size.x/2
	this.sizeHalf.y = size.y/2
}

VisualObj.prototype.getSize = function() {
	return new Point(this.size)
}

VisualObj.prototype.getIndexes = function(p) {
	if (p == null)
		p = this.pos

	if (p.x != this.posLast.x)
		this.indexes.x = Math.floor(p.x/VisualObj.TILE_SIZE)

	if (p.y != this.posLast.y)
		this.indexes.y = Math.floor(p.y/VisualObj.TILE_SIZE)

	return this.indexes
}

VisualObj.prototype.isColliding = function(p) {
	return p.x >= this.pos.x - this.sizeHalf.x &&
		p.x <= this.pos.x + this.sizeHalf.x &&
		p.y >= this.pos.y - this.sizeHalf.y &&
		p.y <= this.pos.y + this.sizeHalf.y
}

VisualObj.prototype.destroy = function() {
	delete this.onUpdate

	this.shape.parentNode.removeChild(this.shape)

	delete this
}

function WebTile(container, map, sprites, loadCallback) {
	this.container = container
	this.map = map
	this.sprites = sprites
	this.loadCallback = loadCallback || function(){}

	this.init()
}

WebTile.LOAD_COMPLETE = "loadComplete"
WebTile.TILE_SIZE = 16
WebTile.MASK_FLOOR = 0xffffff ^ WebTile.TILE_SIZE - 1

WebTile.prototype.container = null
WebTile.prototype.map = null
WebTile.prototype.sprites = null
WebTile.prototype.grid = null
WebTile.prototype.tiles = null
WebTile.prototype.loadCallback = null

WebTile.prototype.init = function() {
	var r,c,t,s

	this.onResize()

	//this.container.style.overflow = "hidden"
	this.grid = document.createElement("div")
	this.grid.style.position = "relative"
	this.tiles = []

	for (r = 0; r < this.rt; ++r) {
		this.tiles[r] = []

		for (c = 0; c < this.ct; ++c) {
			t = document.createElement("div")
			s = t.style
			s.position = "absolute"
			s.width = s.height = WebTile.TILE_SIZE + "px"
			s.backgroundRepeat = "no-repeat"
			s.left = c*16 + "px"
			s.top = r*16 + "px"

			this.tiles[r].push(t)
			this.grid.appendChild(t)
		}
	}

	this.container.appendChild(this.grid)

	Utils.preloadImages(this.sprites, Utils.createDelegate(this, function() {
		this.update()
		this.loadCallback()
	}))
}

WebTile.prototype.onResize = function() {
	this.ct = (this.container.offsetWidth & WebTile.MASK_FLOOR)/WebTile.TILE_SIZE + 1
	this.rt = (this.container.offsetHeight & WebTile.MASK_FLOOR)/WebTile.TILE_SIZE + 1
}

WebTile.prototype.update = function() {
	var r,c

	for (r = 0; r < this.rt; ++r)
		for (c = 0; c < this.ct; ++c)
			if (r < this.map.length && c < this.map[r].length && this.map[r][c] < this.sprites.length)
				this.tiles[r][c].style.backgroundImage = "url(" + this.sprites[this.map[r][c]] + ")"
}