const Category = require("./Category");
const Command = require("./Command");
const Eris = require("eris");
const fs = require("fs");
const middleware = require("./middleware");
const path = require("path");

class Wiggle {
	constructor(options) {
		this.commands = new Eris.Collection();
		this.categories = new Eris.Collection();
		this.erisClient = null;
		this.locals = {};

		this._events = [];
		this._events.start = this._listen;
		this._middleware = [];
		this._options = {};
	}

	connect() {
		this.erisClient.connect();
		return this;
	}

	command(...params) {
		const command = new Command(this, ...params);
		if(!this.commands.has(command.category)) {
			this.commands.set(command.category, new Eris.Collection())
				.get(command.category)
				.set(command.name, command);
		}

		this.use(command);
		return this;
	}

	get(name) {
		return this._options[name];
	}

	set(name, value) {
		if(name === "token") {
			this.erisClient = new Eris(value, this._options.clientOptions);
		} else if(name === "commands") {
			value = require("path").resolve(value);
			if(!fs.existsSync(value)) throw new Error(`Invalid path: ${value}`);

			fs.readdirSync(value)
				.filter(file => fs.lstatSync(path.resolve(value, file)).isDirectory())
				.forEach(folder => {
					const category = module.exports.Category(folder, this._options.commandOptions); // eslint-disable-line new-cap, max-len
					fs.readdirSync(value)
						.filter(file => path.extname(file) === "js")
						.filter(file => !fs.lstatSync(path.resolve(value, folder, file)).isDirectory())
						.forEach(file => {
							const scriptExports = require(path.resolve(value, folder, name));
							category.command(file, scriptExports.options, scriptExports.run);
						});
				});
		}

		this._options[name] = value;
		return this;
	}

	use(...params) {
		this._middleware = this._middleware.concat(middleware(this, ...params));
		if(params[0] instanceof Category) this.categories.set(params[0].name, params[0]);
		return this;
	}

	_listen(eventName) {
		if(!this.erisClient) process.nextTick(() => this._listen(eventName));
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
				} else if(eventName === "messageCreate") {
					if(middle.type === "command" && params[0].command && params[0].command.name === middle.name) {
						run = true;
					} else if(middle.type === "category" && params[0].command &&
						params[0].command.category === middle.name) {
						run = true;
					} else if(middle.type === "unknown" && params[0].command &&
							(params[0].command.name === middle.name ||
							(params[0].command.category === middle.name))) {
						run = true;
					}
				}

				if(run) await new Promise(resolve => middle._function(...params, resolve, this));
			}
		};

		process.nextTick(() => this.erisClient.on(eventName, handler));
	}
}

module.exports = () => new Wiggle();
module.exports.middleware = {
	argHandler: require("../middleware/argHandler"),
	dbots: require("../middleware/dbots"),
	dbotsOrg: require("../middleware/dbotsOrg"),
	carbonintex: require("../middleware/carbonitex"),
	commandParser: require("../middleware/commandParser")
};
module.exports.Category = (...params) => new Category(...params);
