const Category = require("./Category");
const Command = require("./Command");
const Eris = require("eris");
const middleware = require("./middleware");

class Wiggle {
	constructor(options) {
		this.locals = {};
		this.commands = new Eris.Collection();
		this.categories = new Eris.Collection();

		this._client = null;
		this._events = [];
		this._events.start = this._listen;
		this._middleware = [];
		this._options = {};
	}

	connect() {
		process.nextTick(() => this._client.connect());
	}

	command(...params) {
		const command = new Command(this, ...params);
		if(!this.commands.has(command.category)) {
			this.commands.set(command.category, new Eris.Collection())
				.get(command.category)
				.set(command.name, command);
		}

		this.use(command);
	}

	get(name) {
		return this._options[name];
	}

	set(name, value) {
		this._options[name] = value;

		if(name === "token") this._client = new Eris(this._options.token, this._options.clientOptions);
	}

	use(...params) {
		this._middleware = this._middleware.concat(middleware(this, ...params));
		if(params[0] instanceof Category) this.categories.set(params[0].name, params[0]);
	}

	_listen(eventName) {
		if(!this._client) process.nextTick(() => this._listen(eventName));
		if(~this._events.indexOf(eventName)) return;

		this._events.push(eventName);
		const handler = async (...params) => {
			let allMiddles = this._middleware.reduce((total, mid) => {
				if(mid.type === "category") total = total.concat(mid.category._middleware);
				else total.push(mid);
				return total;
			}, []);

			for(let middle of allMiddles) {
				let run = false;
				if(middle.type === "event" && middle.event === eventName) {
					run = true;
				} else if(middle.type === "global") {
					if(middle.category && params[0].command && params[0].command.category === middleware.category) {
						run = true;
					} else if(!middle.category) {
						run = true;
					}
				} else if(middle.type === "command" && params[0].command && params[0].command.name === middle.name) {
					run = true;
				} else if(middle.type === "category" && params[0].command &&
						params[0].command.category === middle.name) {
					run = true;
				} else if(middle.type === "unknown" && params[0].command &&
						(params[0].command.name === middle.name ||
						(params[0].command.category === middle.name))) {
					run = true;
				}

				if(run) await new Promise(resolve => middle._function(...params, resolve, this));
			}
		};

		process.nextTick(() => this._client.on(eventName, handler));
	}
}

module.exports = () => new Wiggle();
module.exports.middleware = { commandParser: require("../middleware/commandParser") };
module.exports.Category = (...params) => new Category(...params);
