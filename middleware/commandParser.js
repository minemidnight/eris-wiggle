const commandParser = async (message, next, wiggle) => {
	let prefixes;
	if(wiggle._options.getPrefixes) prefixes = await wiggle._options.getPrefixes(message);
	else prefixes = wiggle._options.prefixes || ["mention"];

	prefixes = prefixes.filter((ele, i, arr) => arr.indexOf(ele) === i);
	if(~prefixes.indexOf("mention")) prefixes[prefixes.indexOf("mention")] = `<@!?${wiggle.erisClient.user.id}>`;
	const prefixRegex = new RegExp(`^(?:${prefixes.join("|")}),?(?:\\s+)?([\\s\\S]+)`, "i");

	message.originalContent = message.content;
	let match = message.content.match(prefixRegex);
	if(!match && message.channel.guild) return;
	else if(match) [, message.content] = match;

	let command;
	if(!~message.content.indexOf(" ")) {
		command = message.content;
		message.content = "";
	} else {
		command = message.content.substring(0, message.content.indexOf(" "));
		message.content = message.content.substring(message.content.indexOf(" ")).trim();
	}
	command = command.toLowerCase().trim();

	const middlewares = wiggle._middleware.reduce((total, mid) => {
		if(mid.type === "category") {
			const commands = [...mid.category._middleware].filter(mid2 => mid2.type === "command");
			total = total.concat(commands);
		} else if(mid.type === "command") {
			total.push(mid);
		}

		return total;
	}, []);

	command = middlewares.find(middleware => middleware.name === command || ~middleware.command.aliases.indexOf(command));
	if(!command) {
		return;
	} else if(command.command.guildOnly) {
		message.channel.message.createMessage(message.t("wiggle.commands.error.guildOnly"));
		return;
	}

	if(!command.command.caseSensitive) message.content = message.content.toLowerCase();
	message.command = command.command;

	next();
};

module.exports = () => commandParser;
