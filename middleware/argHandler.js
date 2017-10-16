const resolver = require("../lib/resolver.js");

const argHandler = async (message, next, wiggle) => {
	let command = message.command;
	if(!command) return next();

	message.content = message.content.trim();
	if(command.args.length === 0) {
		message.args = [message.content.trim()];
		return next();
	}

	let args = [], currentQuoted = false, startIndex = 0;
	for(let i = 0; i < message.content.length; i++) {
		if(command.args.length === 1) {
			if((message.content.startsWith(`"`) && message.content.endsWith(`"`)) ||
				(message.content.startsWith("'") && message.content.endsWith("'")) ||
				(message.content.startsWith("`") && message.content.endsWith("`"))) {
				args = [message.content.substring(1, message.content.length - 1).trim()];
			} else {
				args = [message.content.trim()];
			}
			break;
		}

		let char = message.content.charAt(i);
		if(char === `"` || char === "'" || char === "`") {
			if(currentQuoted === false) {
				startIndex = i + 1;
			} else {
				args.push(message.content.substring(startIndex, i));

				if(command.args.length - 1 === args.length) {
					args.push(message.content.substring(i + 1).trim());
					break;
				}
				startIndex = 0;
			}
			currentQuoted = !currentQuoted;
		} else if(char === " " && !currentQuoted) {
			if((startIndex === 0 && args.length === 0) || startIndex !== 0) {
				args.push(message.content.substring(startIndex, i));

				if(command.args.length - 1 === args.length) {
					args.push(message.content.substring(i + 1).trim());
					startIndex = 0;
					break;
				}
			}
			startIndex = i + 1;
		}
	}
	if((startIndex !== 0 && args.length < command.args.length) ||
		(startIndex === 0 && args.length === 0 && message.content.length !== 0)) {
		args.push(message.content.substring(startIndex));
	}

	if(args.length < command.args.filter(arg => !arg.optional).length) {
		if(command.embedError === true) {
			return message.channel.createEmbed({
				fields: [
					{
						name: "Input:",
						value: message.originalContent
					},
					{
						name: "Error:",
						value: message.t("wiggle.missingArgs", { command: command.name, usage: command.usage })
					}
				],
				color: 0xE74C3C,
				timestamp: new Date(),
				footer: { text: message.t("wiggle.embed.footer", { tag: `${message.author.username}#${message.author.discriminator}` }) } // eslint-disable-line
			});
		} else return message.channel.createMessage(message.t("wiggle.missingArgs", { command: command.name, usage: command.usage })); // eslint-disable-line
	}

	message.args = [];
	for(let i = 0; i < args.length; i++) {
		let arg = args[i];
		let argOptions = command.args[i];

		try {
			message.args[i] = await resolver[argOptions.type](arg, message, argOptions);
		} catch(err) {
			if(command.embedError === true) {
				return message.channel.createEmbed({
					fields: [
						{
							name: "Error:",
							value: message.t(err.message, err.data)
						}
					],
					color: 0xE74C3C,
					timestamp: new Date(),
					footer: { text: message.t("wiggle.embed.footer", { tag: `${message.author.username}#${message.author.discriminator}` }) } // eslint-disable-line
				});
			} else return message.channel.createMessage(message.t(err.message, err.data)); // eslint-disable-line
		}
	}

	return next();
};

module.exports = () => argHandler;
