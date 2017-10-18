const Category = require("./Category");
const Command = require("./Command");
const Eris = require("eris");
const fs = require("fs");
const locale = require("./locale");
const middleware = require("./middleware");
const path = require("path");

class Wiggle {
	constructor() {
		this.commands = new Eris.Collection();
		this.categories = new Eris.Collection();
		this.erisClient = null;
		this.locals = { options: {} };

		this._events = [];
		this._middleware = [];
		this._t = locale;
		this._locales = new Map();
		this._locales.set("en", require(path.resolve(__dirname, "locales", "en.json")));

		this.use("message", async (message, next, wiggle) => {
			if(this.get("localeFunction")) await this.get("localeFunction")(message);

			message.t = (context, data) => this._t(message.locale || "en", context, data, wiggle); // eslint-disable-line id-length, max-len
			if(message.channel.guild) {
				message.channel.guild.t = (context, data) => { // eslint-disable-line id-length
					this._t(message.channel.guild.locale || "en", context, data, wiggle);
				};
			}

			next();
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
		switch(name) {
			case "token": {
				this.erisClient = new Eris(value, this.get("clientOptions") || {});
				break;
			}
			case "commands": {
				value = require("path").resolve(value);
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
				value = require("path").resolve(value);
				if(!fs.existsSync(value)) throw new Error(`Invalid path: ${value}`);

				fs.readdirSync(value)
					.filter(file => path.extname(file) === ".js")
					.filter(file => !fs.lstatSync(path.resolve(value, file)).isDirectory())
					.forEach(file => this.use(path.basename(file, ".js"), require(path.resolve(value, file))));
				break;
			}
			case "locales": {
				this._locales = new Map();
				value = require("path").resolve(value);
				if(!fs.existsSync(value)) throw new Error(`Invalid path: ${value}`);

				fs.readdirSync(value)
					.filter(file => path.extname(file) === ".json")
					.filter(file => !fs.lstatSync(path.resolve(value, file)).isDirectory())
					.forEach(file => {
						let localeFile = require(path.resolve(value, file));
						const wiggleLocale = path.resolve(__dirname, "locales", file);
						const exists = fs.existsSync(wiggleLocale);

						if(!exists) localeFile = Object.assign(localeFile, require(path.resolve(__dirname, "locales", "en.json")));
						else localeFile = Object.assign(localeFile, require(wiggleLocale));

						this._locales.set(path.basename(file, ".json"), localeFile);
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
			}, []);

			allMiddles = [
				...allMiddles.splice(0, 2),
				...allMiddles.filter(mid => ~["category", "unknown"].indexOf(mid.type)),
				...allMiddles.filter(mid => !~["category", "unknown", "command"].indexOf(mid.type)),
				...allMiddles.filter(mid => mid.type === "command")
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
