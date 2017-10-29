const Category = require("./Category");
const Command = require("./Command");
const Eris = require("eris");
const fs = require("fs");
const Locale = require("./Locale");
const middleware = require("./middleware");
const path = require("path");
const translate = require("./translate");

class Wiggle {
	constructor(options) {
		this.commands = new Eris.Collection();
		this.categories = new Eris.Collection();
		this.erisClient = null;
		this.locals = { options: {} };

		this._events = [];
		this._middleware = [];
		this._t = translate;
		this._locales = new Map();
		this._locales.set("en", new Locale(path.resolve(__dirname, "locales", "en.json")));

		if(options) this.set(options);

		this.use("message", {
			priority: 100,
			middleware: async (message, next, wiggle) => {
				if(this.get("localeFunction")) await this.get("localeFunction")(message);

				message.t = (context, data) => this._t(message.locale || "en", context, data, wiggle); // eslint-disable-line id-length, max-len
				if(message.channel.guild) {
					message.channel.guild.t = (context, data) => { // eslint-disable-line id-length
						this._t(message.channel.guild.locale || "en", context, data, wiggle);
					};
				}

				next();
			}
		});
	}

	connect() {
		this.erisClient.connect();
		return this;
	}

	command(...params) {
		const command = new Command(this, ...params);
		if(!this.commands.has(command.name)) {
			this.commands.set(command.name, new Eris.Collection())
				.get(command.name)
				.set(command.name, command);
		}

		this.use(command);
		return this;
	}

	get(name) {
		return this.locals.options[name];
	}

	set(name, value) {
		if(typeof name === "object") {
			const set = this.set.bind(this);
			Object.entries(name).forEach(([key, val]) => set(key, val));
			return this;
		}

		switch(name) {
			case "token": {
				this.erisClient = new Eris(value, this.get("clientOptions") || {});
				break;
			}
			case "commands": {
				value = path.resolve(value);
				if(!fs.existsSync(value)) throw new Error(`Invalid path: ${value}`);

				fs.readdirSync(value)
					.filter(file => fs.lstatSync(path.resolve(value, file)).isDirectory())
					.forEach(folder => {
						const category = module.exports.Category(folder, Object.assign({}, this.get("commandOptions") || {})); // eslint-disable-line new-cap, max-len
						fs.readdirSync(path.resolve(value, folder))
							.filter(file => path.extname(file) === ".js")
							.filter(file => !fs.lstatSync(path.resolve(value, folder, file)).isDirectory())
							.forEach(file => {
								const scriptExports = require(path.resolve(value, folder, file));
								let run = scriptExports.run;
								delete scriptExports.run;

								category.command(path.basename(file, ".js"), scriptExports, run);
							});

						this.use(category);
					});
				break;
			}
			case "listeners": {
				value = path.resolve(value);
				if(!fs.existsSync(value)) throw new Error(`Invalid path: ${value}`);

				fs.readdirSync(value)
					.filter(file => path.extname(file) === ".js")
					.filter(file => !fs.lstatSync(path.resolve(value, file)).isDirectory())
					.forEach(file => this.use(path.basename(file, ".js"), require(path.resolve(value, file))));
				break;
			}
			case "locales": {
				this._locales = new Map();
				value = path.resolve(value);
				if(!fs.existsSync(value)) throw new Error(`Invalid path: ${value}`);

				fs.readdirSync(value)
					.filter(file => ~[".js", ".json"].indexOf(path.extname(file)))
					.map(file => path.resolve(value, file))
					.filter(file => !fs.lstatSync(file).isDirectory())
					.forEach(file => {
						const localeName = path.basename(file, path.extname(file));
						if(localeName === "en") {
							const required = require(file);
							const relativePath = path.relative(
								path.resolve(file, "../"),
								path.resolve(__dirname, "locales", "en.json")
							);

							if(required.imports) required.imports.push(relativePath);
							else required.imports = [relativePath];
						}

						this._locales.set(localeName, new Locale(file));
					});

				break;
			}
		}

		this.locals.options[name] = value;
		return this;
	}

	use(...params) {
		this._middleware = this._middleware.concat(middleware(this, ...params));
		if(params[0] instanceof Category) this.categories.set(params[0].name, params[0]);
		return this;
	}

	_listen(eventName) {
		if(!this.erisClient) {
			process.nextTick(() => this._listen(eventName));
			return;
		} else if(~this._events.indexOf(eventName)) {
			return;
		}

		this._events.push(eventName);
		const handler = async (...params) => {
			let allMiddles = this._middleware.reduce((total, mid) => {
				if(mid.type === "category" && !mid._function) total = total.concat(mid.category._middleware);
				else total.push(mid);
				return total;
			}, []).sort((a, b) => b.priority - a.priority);

			allMiddles = [
				...allMiddles.filter(mid => mid.priority >= 50),
				...allMiddles.filter(mid => mid.priority < 50 && ~["category", "unknown"].indexOf(mid.type)),
				...allMiddles.filter(mid => mid.priority < 50 && !~["category", "unknown", "command"].indexOf(mid.type)),
				...allMiddles.filter(mid => mid.priority < 50 && mid.type === "command")
			];

			for(let middle of allMiddles) {
				let run = false;
				if(middle.type === "event" && middle.event === eventName) {
					run = true;
				} else if(middle.type === "global") {
					if(eventName === "messageCreate" && middle.category && params[0].command &&
						params[0].command.category === middleware.category) {
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

		this.erisClient.on(eventName, handler);
	}
}

module.exports = (...params) => new Wiggle(...params);
module.exports.Category = (...params) => new Category(...params);
module.exports.middleware = {
	argHandler: require("../middleware/argHandler"),
	dbots: require("../middleware/dbots"),
	dbotsOrg: require("../middleware/dbotsOrg"),
	carbonitex: require("../middleware/carbonitex"),
	commandParser: require("../middleware/commandParser")
};
