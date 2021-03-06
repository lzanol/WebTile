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

function WebTile() {}
WebTile.TILE_SIZE = 16
WebTile.MASK_FLOOR = 0xffffff ^ WebTile.TILE_SIZE - 1
WebTile.MASK_CROP = (WebTile.TILE_SIZE << 1) - 1
WebTile.BITS_EXP = Math.log(WebTile.TILE_SIZE)/Math.log(2)

WebTile.Config = function() {}
WebTile.Config.prototype.container = null
WebTile.Config.prototype.spriteSet = null
WebTile.Config.prototype.spriteMap = null
WebTile.Config.prototype.tileSet = null

WebTile.prototype.container = null
WebTile.prototype.grid = null
WebTile.prototype.tiles = null
WebTile.prototype.onLoad = null

WebTile.prototype.load = function(config, onLoad) {
	this.container = config.container
	this.onLoad = onLoad || function(){}

	this.init()
}

WebTile.prototype.init = function() {
	var r,c,t,s

	this.updateSize()

	this.container.style.overflow = "hidden"
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
			s.left = (c << WebTile.BITS_EXP) + "px"
			s.top = (r << WebTile.BITS_EXP) + "px"

			this.tiles[r].push(t)
			this.grid.appendChild(t)
		}
	}

	this.container.appendChild(this.grid)

	Utils.preloadImages(this.sprites, Utils.createDelegate(this, function() {
		this.updateTiles()
		this.loadCallback()
	}))
}

WebTile.prototype.updateSize = function() {
	this.ct = (this.bwCeil(this.container.offsetWidth) >> WebTile.BITS_EXP) + 1
	this.rt = (this.bwCeil(this.container.offsetHeight) >> WebTile.BITS_EXP) + 1
}

WebTile.prototype.updateTiles = function() {
	var r,c

	for (r = 0; r < this.rt; ++r)
		for (c = 0; c < this.ct; ++c)
			if (r < this.map.length && c < this.map[r].length && this.map[r][c] < this.sprites.length)
				this.tiles[r][c].style.backgroundImage = "url(" + this.sprites[this.map[r][c]] + ")"
}

WebTile.prototype.scroll = function(x, y) {
	this.grid.style.left = x + "px"
	this.grid.style.top = y + "px"
}

WebTile.prototype.bwCeil = function(n) {
	return n & WebTile.MASK_CROP == WebTile.TILE_SIZE ?
		n : n + WebTile.TILE_SIZE & WebTile.MASK_FLOOR
}