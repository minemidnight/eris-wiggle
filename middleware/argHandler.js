const parseArgs = require("minimist");
const resolver = require("../lib/resolver.js");

const argHandler = async (message, next, wiggle) => {
	const { command } = message;
	if(!command) return next();

	const parsed = parseArgs(message.content.split(" "), {
		string: command.flags.filter(flag => flag.type !== "boolean").map(({ name }) => name),
		boolean: command.flags.filter(flag => flag.type === "boolean").map(({ name }) => name),
		alias: command.flags.reduce((a, b) => {
			if(b.aliases || b.short) a[b.name] = (b.aliases || []).concat(b.short || []);
			return a;
		}, {}),
		default: command.flags.reduce((a, b) => {
			if(b.default) a[b.name] = b.default;
			return a;
		}, {})
	});

	message.flags = {};
	for(const key in parsed) {
		if(key === "_") continue;

		const value = parsed[key];
		const flag = command.flags.find(({ name }) => name === key);
		if(!flag) continue;

		try {
			message.flags[flag.name] = await resolver[flag.type](value.toString(), message, flag);
		} catch(err) {
			message.channel.createMessage(message.t(err.message, err.data));
			return false;
		}
	}

	message.args = [];
	for(let i = 0; i < command.args.length || 1; i++) {
		let arg, quoted, quoteType;
		if(i >= (command.args.length - 1)) arg = parsed._.splice(0).join(" ");
		else arg = parsed._.splice(0, 1)[0];

		if(!arg) break;
		if(/^("|'|`)/.test(arg)) {
			quoted = true;
			quoteType = arg.charAt(0);

			do {
				if(arg.endsWith(quoteType)) {
					quoted = false;
					arg = arg.slice(1, -1);
					break;
				}

				arg += parsed._.splice(0, 1)[0];
			} while(quoted && parsed._.length);
		}

		message.args.push(arg);
	}

	if(message.args.length < command.args.filter(arg => !arg.optional).length) {
		message.channel.createMessage(message.t("wiggle.missingArgs", { command: command.name, usage: command.usage }));
		return false;
	}

	for(let i = 0; i < message.args.length; i++) {
		let arg = message.args[i];
		let argOptions = command.args[i];

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
