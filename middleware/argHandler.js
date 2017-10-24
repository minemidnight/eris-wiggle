const parseArgs = require("yargs-parser");
const resolver = require("../lib/resolver.js");

const argHandler = async (message, next, wiggle) => {
	const { command } = message;
	if(!command) return next();

	const parsed = parseArgs(message.content, {
		string: command.flags.filter(flag => flag.type !== "boolean").map(({ name }) => name),
		boolean: command.flags.filter(flag => flag.type === "boolean").map(({ name }) => name),
		alias: command.flags.reduce((a, b) => {
			if(b.aliases || b.short) a[b.name] = (b.aliases || []).concat(b.short || []);
			return a;
		}, {}),
		default: command.flags.reduce((a, b) => {
			if(b.default) a[b.name] = b.default;
			return a;
		}, {}),
		configuration: {
			"short-option-groups": false,
			"camel-case-expansion": false,
			"dot-notation": false
		}
	});

	message.args = parsed._;
	if(message.args > command.args.length) {
		message.args[command.args.length - 1] = message.args.splice(command.args.length).join(" ");
	}

	message.flags = {};
	for(const key in parsed) {
		if(key === "_") continue;

		const value = parsed[key];
		const flag = command.flags.find(({ name }) => name === key);
		if(!flag) continue;

		try {
			if(Array.isArray(value)) {
				message.flags[flag.name] = await Promise.all(
					value.map(toResolve => resolver[flag.type](toResolve.toString(), message, flag))
				);
			} else {
				message.flags[flag.name] = await resolver[flag.type](value.toString(), message, flag);
			}
		} catch(err) {
			message.channel.createMessage(message.t(err.message, err.data));
			return false;
		}
	}

	if(message.args.length < command.args.filter(arg => !arg.optional).length) {
		message.channel.createMessage(message.t("wiggle.missingArgs", { command: command.name, usage: command.usage }));
		return false;
	}

	for(let i = 0; i < message.args.length; i++) {
		let arg = message.args[i];
		let argOptions = command.args[i] || { type: "text" };

		try {
			message.args[i] = await resolver[argOptions.type](arg, message, argOptions);
		} catch(err) {
			message.channel.createMessage(message.t(err.message, err.data));
			return false;
		}
	}

	return next();
};

module.exports = () => argHandler;
