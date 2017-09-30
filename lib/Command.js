class Command {
	constructor(wiggle, name, ...extra) {
		this.aliases = [];
		this.category = "default";
		this.locals = {};
		this.name = name;
		this.options = { runNext: false };

		if(extra.length === 1) {
			this.process = extra[0];
		} else {
			this.options = extra[0];
			this.process = extra[1];

			if(this.options.category) {
				this.category = this.options.category;
				delete this.options.category;
			}
		}
	}

	async run(message, next, wiggle) {
		if(this.command.options.sendTyping) await message.channel.sendTyping();

		const context = {
			author: message.author,
			category: this.command.category,
			channel: message.channel,
			client: wiggle._client,
			content: message.content,
			command: this.command,
			guild: message.channel.guild,
			message,
			reply: (content, file) => {
				let params = [undefined, undefined];
				if(content.embed) params[0] = { embed: content.embed };
				else if(content.file) params[1] = content.file;
				else if(file) params[1] = file;
				else if(Array.isArray(content)) params = content;
				else params = [content];

				return message.channel.createMessage(...params);
			},
			wiggle
		};

		const result = await this.command.process(context, next);
		if(this.command.options.replyResult) context.reply(result);
		if(this.command.options.runNext) next();
	}
}

module.exports = Command;
