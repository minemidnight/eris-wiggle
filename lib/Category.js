const Eris = require("eris");

class Category {
	constructor(name, commandOptions) {
		this.locals = {};
		this.commands = new Eris.Collection();
		this.name = name.toLowerCase() || "default";

		this._commandOptions = commandOptions || {};
		this._middleware = [];
	}

	name(name) {
		this.name = name.toLowerCase();
		return this;
	}

	command(...params) {
		if(params.length === 2) params = [params[0], {}, params[1]];

		params[1] = Object.assign({}, this._commandOptions, params[1]);
		params[1].category = this.name;
		this.commands.set(params[0].toLowerCase(), params.slice(1));
		return this;
	}

	use(...params) {
		const middleware = require("./middleware");
		this._middleware = this._middleware.concat(middleware(this, ...params));
		return this;
	}

	get subcommands() {
		const subcommands = new Eris.Collection();
		this._middleware.filter(({ type }) => type === "subcommand")
			.forEach(subcommand => subcommands.set(subcommand.name, subcommand.subCommands));

		return subcommands;
	}
}

module.exports = Category;
