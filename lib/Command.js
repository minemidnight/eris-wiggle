class Command {
	constructor(wiggle, name, ...extra) {
		let options = {};
		if(extra.length === 1) {
			this.process = extra[0];
		} else {
			this.process = extra[1];
			options = extra[0];
		}

		Object.entries(options).forEach(([key, value]) => this[key] = value);
		this.locals = {};
		this.name = name;
		this.aliases = options.aliases || [];
		this.args = options.args || [];
		this.category = options.category || "default";
		this.caseSensitive = !!options.caseSensitive;
		this.description = options.description;
		this.guildOnly = !!options.guildOnly;

		if(!this.args.length) {
			this.usage = "[]";
		} else {
			this.usage = this.args.reduce((usage, arg) => {
				arg.label = arg.label || arg.type;
				usage += arg.optional ? `[${arg.label}] ` : `<${arg.label}> `;
				return usage;
			}, "").trim();
		}
	}

	async run(message, next, wiggle) {
		const { command } = this;
		if(command.sendTyping) await message.channel.sendTyping();

		const context = {
			author: message.author,
			category: command.category,
			channel: message.channel,
			client: wiggle.erisClient,
			content: message.content,
			command,
			guild: message.channel.guild,
			message,
			reply: (content, file) => {
				let params = [undefined, undefined];
				if(typeof content === "object" && content.embed) params[0] = { embed: content.embed };
				else if(typeof content === "object" && content.file) params[1] = content.file;
				else if(file) params[1] = file;
				else if(typeof content === "object" && Array.isArray(content)) params = content;
				else params = [content];

				return message.channel.createMessage(...params);
			},
			wiggle
		};

		const result = await command.process(context, next);
		if(command.replyResult) context.reply(result);
		if(command.runNext) next();
	}
}

module.exports = Command;
