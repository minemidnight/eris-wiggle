const linkRegex = /^((https|http|ftp|rtsp|mms)?:\/\/)?(([0-9a-z_!~*'().&=+$%-]+:)?[0-9a-z_!~*'().&=+$%-]+@)?(([0-9]{1,3}\.){3}[0-9]{1,3}|([0-9a-z_!~*'()-]+\.)*([0-9a-z][0-9a-z-]{0,61})?[0-9a-z]\.[a-z]{2,6})(:[0-9]{1,4})?((\/?)|(\/[0-9a-z_!~*'().;?:@&=+$,%#-]+)+\/?)$/im; // eslint-disable-line max-len

class ResolverError extends Error {
	constructor(path, data = {}) {
		super(path);
		this.data = data;
	}
}

function getUsers(input, users) {
	let matches = {
		1: [],
		2: [],
		3: []
	};

	input = input.toLowerCase();
	if(~input.indexOf("#")) {
		let index = input.lastIndexOf("#");
		var discrim = input.substring(index + 1);
		input = input.substring(0, index);
		if(isNaN(discrim)) discrim = false;
	}

	users.forEach(user => {
		let matchLevel = 0;
		let username = user.user ? user.user.username.toLowerCase() : user.username.toLowerCase();
		let nick = user.nick ? user.nick.toLowerCase() : null;

		if(discrim && (user.user ? user.user.discriminator : user.discriminator) === discrim) discrim = true;
		else if(discrim) return;

		if(user.id === input) matchLevel = 3;
		else if(nick && nick === input && discrim) matchLevel = 3;
		else if(username === input && discrim) matchLevel = 3;
		else if(nick && nick === input) matchLevel = 2;
		else if(username === input) matchLevel = 2;
		else if(username.startsWith(input)) matchLevel = 1;
		else if(nick && nick.startsWith(input)) matchLevel = 1;

		if(matchLevel) matches[matchLevel].push(user.user || user);
	});

	if(matches[3].length) return matches[3];
	else if(matches[2].length) return matches[2];
	else if(matches[1].length) return matches[1];
	else return undefined;
}

const resolver = {
	boolean: (input, message) => {
		if(~["enable", "yes", "true", "1"].indexOf(input)) return true;
		else if(~["disable", "no", "false", "0"].indexOf(input)) return false;
		else throw new ResolverError("wiggle.resolver.error.booleanError");
	},
	channel: (input, message) => {
		if(input.match(/<#(\d{17,21})>/)) input = input.match(/<#(\d{17,21})>/)[1];
		const foundChannel = message.channel.guild.channels
			.find(ch => input === ch.id || input.toLowerCase() === ch.name.toLowerCase());

		if(foundChannel) return foundChannel;
		else throw new ResolverError("wiggle.resolver.error.channelNotFound");
	},
	emoji: (input, message) => {
		const match = input.match(/<:([a-z0-9-_]{2,32}):(\d{17,21})>/i);
		if(!match) throw new ResolverError("wiggle.resolver.error.emojiNotFound");

		return {
			name: match[1],
			id: match[2],
			url: `https://cdn.discordapp.com/emojis/${match[2]}.png`
		};
	},
	float: (input, message, options = {}) => {
		if(isNaN(input)) throw new ResolverError("wiggle.resolver.error.NaN");
		else input = parseFloat(input);
		if(options.min && input < options.min) {
			throw new ResolverError("wiggle.resolver.error.belowMin", { min: options.min });
		} else if(options.max && input > options.max) {
			throw new ResolverError("wiggle.resolver.error.aboveMax", { max: options.max });
		} else {
			return input;
		}
	},
	image: (input, message) => {
		let imageURL;
		if(message.attachments.length && message.attachments[0].width) {
			imageURL = message.attachments[0].url;
		} else if(linkRegex.test(input)) {
			imageURL = input;
		} else {
			try {
				let { url } = module.exports.emoji(input, message);
				imageURL = url;
			} catch(err) {
				try {
					let { avatarURL } = module.exports.user(input, message);
					imageURL = avatarURL;
				} catch(err2) {
					throw new ResolverError("wiggle.resolver.error.noImage");
				}
			}
		}

		return imageURL;
	},
	int: (input, message, options = {}) => {
		if(isNaN(input)) throw new ResolverError("wiggle.resolver.error.NaN");
		else input = parseInt(input);
		if(options.min && input < options.min) {
			throw new ResolverError("wiggle.resolver.error.belowMin", { min: options.min });
		} else if(options.max && input > options.max) {
			throw new ResolverError("wiggle.resolver.error.aboveMax", { max: options.max });
		} else {
			return input;
		}
	},
	invite: async (input, message) => {
		const match = input.match(/^discord(\\.gg|app\\.com\/invite)\/([a-z0-9-_]{2,16})$/i);
		if(!match) throw new ResolverError("wiggle.resolver.error.invalidInvite");

		try {
			return await (message.channel.guild ? message.channel.guild.shard.client : message.channel._client)
				.getInvite(match[1]);
		} catch(err) {
			throw new ResolverError("wiggle.resolver.error.invalidInvite");
		}
	},
	link: (input, message) => {
		if(!linkRegex.test(input)) throw new ResolverError("wiggle.resolver.error.invalidLink");
		else return input.trim();
	},
	member: (input, message) => {
		if(!message.channel.guild) throw new ResolverError("wiggle.resolver.error.cantResolveMember");

		const user = module.exports.user(input, message);

		if(!message.channel.guild.members.has(user.id)) return message.channel.guild.members.get(user.id);
		else throw new ResolverError("wiggle.resolver.error.noMemberFound");
	},
	role: (input, message) => {
		if(input.match(/<@&(\d{17,21})>/)) input = input.match(/<@&(\d{17,21})>/)[1];
		const foundRole = message.channel.guild.roles
			.find(role => input === role.id || input.toLowerCase() === role.name.toLowerCase());

		if(foundRole) return foundRole;
		else throw new ResolverError("wiggle.resolver.error.roleNotFound");
	},
	text: (input, message) => input,
	textChannel: (input, message) => {
		if(input.match(/<#(\d{17,21})>/)) input = input.match(/<#(\d{17,21})>/)[1];
		const foundChannel = message.channel.guild.channels
			.filter(ch => ch.type === 0)
			.find(ch => input === ch.id || input.toLowerCase() === ch.name.toLowerCase());

		if(foundChannel) return foundChannel;
		else throw new ResolverError("wiggle.resolver.error.channelNotFound");
	},
	user: (input, message) => {
		const client = message.channel.guild ? message.channel.guild.shard.client : message.channel._client;
		const match = input.match(/<@!?(\d{17,21})>/)[1];
		if(match && match[1]) {
			if(client.users.has(match[1])) return client.users.get(match[1]);
			else throw new ResolverError("wiggle.resolver.error.userNotCached");
		}

		let users;
		if(message.channel.guild) users = getUsers(input, message.channel.guild.members) || getUsers(input, client.users);
		else users = getUsers(input, client.users);

		if(!users || !users.length) throw new ResolverError("wiggle.resolverError.noUserFound");
		else return users[0];
	},
	voiceChannel: (input, message) => {
		const foundChannel = message.channel.guild.channels
			.filter(ch => ch.type === 2)
			.find(ch => input === ch.id || input.toLowerCase() === ch.name.toLowerCase());

		if(foundChannel) return foundChannel;
		else throw new ResolverError("wiggle.resolver.error.channelNotFound");
	}
};

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
		message.channel.createMessage(message.t("wiggle.missingArgs", { command: command.name, usage: command.usage }));
		return false;
	}

	message.args = [];
	for(let i = 0; i < args.length; i++) {
		let arg = args[i];
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
