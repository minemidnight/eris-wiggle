const Eris = require("eris");

class Category {
	constructor(name, commandOptions) {
		this.locals = {};
		this.commands = new Eris.Collection();
		this.name = name || "default";

		this._commandOptions = commandOptions || { category: this.name };
		this._middleware = [];
	}

	name(name) {
		this.name = name;
	}

	command(...params) {
		if(params.length === 2) params = [params[0], {}, params[1]];

		params[1] = Object.assign(this._commandOptions, params[1]);
		this.commands.set(params[0], params.slice(1));
	}

	use(...params) {
		const middleware = require("./middleware");
		this._middleware = this._middleware.concat(middleware(this, ...params));
	}
}

module.exports = Category;