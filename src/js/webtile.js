// inheritance - http://stackoverflow.com/questions/14564155/javascript-prototypal-inheritance-descendants-override-each-other/14576273#14576273
function Utils() {}

Utils.createDelegate = function(scope, fn) {
	return function() {
		return fn.apply(scope, arguments)
	}
}

Utils.inherit = function(subClass, superClass) {
	var T = function(){}
	T.prototype = superClass.prototype
	subClass.prototype = new T()
	subClass.prototype.constructor = subClass
}

function WebTile(panel) {
	this.panel = panel
}

WebTile.prototype.panel = null