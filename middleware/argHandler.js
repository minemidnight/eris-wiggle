const parseArgs = require("minimist");
const resolver = require("../lib/resolver.js");

const argHandler = async (message, next, wiggle) => {
	message.flags = {};
	message.args = [];

	const { command } = message;
	if(!command) return next();

	const placeholder = `%__${(Date.now() + process.hrtime().reduce((a, b) => a + b, 0)).toString(36)}__%`;
	const quoteRegex = /(["'])(?:(?=(\\?))\2.)*?\1/g;

	let replaced = "", prev = 0, match = quoteRegex.exec(message.content);
	while(match) {
		if(match.index === quoteRegex.lastIndex) quoteRegex.lastIndex++;

		replaced += message.content.substring(prev, match.index) + match[0].replace(/ /g, placeholder);

		prev = match.index + match[0].length;
		match = quoteRegex.exec(message.content);
	}

	replaced += message.content.substring(prev);
	const parsed = parseArgs(replaced.split(" "), {
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

	const placeholderRegex = new RegExp(placeholder, "g");
	for(const key in parsed) {
		let value = parsed[key];
		if(key === "_") {
			parsed[key] = value.map(arg => typeof arg === "string" && ~arg.indexOf(placeholder) ?
				arg.replace(placeholderRegex, " ") : arg);
			continue;
		}

		if(/^(['"]).+?\1$/.test(value)) value = value.slice(1, -1);
		if(typeof value === "string" && ~value.indexOf(placeholder)) {
			value = value.replace(placeholderRegex, " ");
		} else if(Array.isArray(value)) {
			value = value.map(flag => typeof flag === "string" && ~flag.indexOf(placeholder) ?
				flag :
				flag.replace(placeholderRegex, " "));
		}

		const flag = command.flags.find(({ name }) => name === key);
		if(!flag) continue;
		else if(flag.array && !Array.isArray(value)) value = [value];

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

	for(let i = 0; i < command.args.length || 1; i++) {
		let arg, quoted;
		if(i >= (command.args.length - 1)) arg = parsed._.splice(0).join(" ");
		else arg = parsed._.splice(0, 1)[0];

		if(!arg) break;
		if(typeof arg === "string" && (arg.startsWith(`"`) || arg.startsWith("'"))) {
			quoted = true;

			do {
				if(arg.endsWith(arg.charAt(0))) {
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
		let argOptions = command.args[i] || { type: "text" };

		try {
			message.args[i] = await resolver[argOptions.type](arg.toString(), message, argOptions);
		} catch(err) {
			message.channel.createMessage(message.t(err.message, err.data));
			return false;
		}
	}

	return next();
};

module.exports = () => argHandler;
