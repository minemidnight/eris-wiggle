const Category = require("./Category");
const Command = require("./Command");

const events = {
	callCreate: "callCreate",
	callDelete: "callDelete",
	callRing: "callRing",
	callUpdate: "callUpdate",
	channelCreate: "channelCreate",
	channelAdd: "channelCreate",
	channelDelete: "channelDelete",
	channelRemove: "channelDelete",
	channelPinUpdate: "channelPinUpdate",
	pinUpdate: "channelPinUpdate",
	channelRecipientAdd: "channelRecipientAdd",
	recipientAdd: "channelRecipientAdd",
	channelRecipientRemove: "channelRecipientRemove",
	recipientRemove: "channelRecipientRemove",
	channelUpdate: "channelUpdate",
	channelUpdated: "channelUpdated",
	connect: "connect",
	connected: "connect",
	debug: "debug",
	disconnect: "disconnect",
	disconnected: "disconnect",
	error: "error",
	errored: "error",
	friendSuggestionCreate: "friendSuggestionCreate",
	suggestionCreate: "friendSuggestionCreate",
	guildAvailable: "guildAvailable",
	guildBanAdd: "guildBanAdd",
	banAdd: "guildBanAdd",
	guildBanRemove: "guildBanRemove",
	banRemove: "guildBanRemove",
	guildCreate: "guildCreate",
	guildJoin: "guildCreate",
	guildDelete: "guildDelete",
	guildLeave: "guildDelete",
	guildEmojisUpdate: "guildEmojisUpdate",
	emojisUpdate: "guildEmojisUpdate",
	guildMemberAdd: "guildMemberAdd",
	memberAdd: "guildMemberAdd",
	memberJoin: "guildMemberAdd",
	guildMemberChunk: "guildMemberChunk",
	memberChunk: "guildMemberChunk",
	guildMemberRemove: "guildMemberRemove",
	memberRemove: "guildMemberRemove",
	memberLeft: "guildMemberRemove",
	guildMemberUpdate: "guildMemberUpdate",
	memberUpdate: "guildMemberUpdate",
	memberUpdated: "guildMemberUpdate",
	guildRoleCreate: "guildRoleCreate",
	roleCreate: "guildRoleCreate",
	roleAdd: "guildRoleCreate",
	guildRoleDelete: "guildRoleDelete",
	roleDelete: "guildRoleDelete",
	roleRemove: "guildRoleDelete",
	guildRoleUpdate: "guildRoleUpdate",
	roleUpdate: "guildRoleUpdate",
	guildUnavailable: "guildUnavailable",
	guildUpdate: "guildUpdate",
	guildUpdated: "guildUpdate",
	messageCreate: "messageCreate",
	message: "messageCreate",
	messageAdd: "messageCreate",
	messageDelete: "messageDelete",
	messageRemove: "messageDelete",
	messageDeleteBulk: "messageDeleteBulk",
	messagesDelete: "messageDeleteBulk",
	messageReactionAdd: "messageReactionAdd",
	reactionAdd: "messageReactionAdd",
	reactionCreate: "messageReactionAdd",
	messageReactionRemove: "messageReactionRemove",
	reactionRemove: "messageReactionRemove",
	reactionDelete: "messageReactionRemove",
	messageReactionRemoveAll: "messageReactionRemoveAll",
	reactionRemoveAll: "messageReactionRemoveAll",
	reactionsRemove: "messageReactionRemoveAll",
	messageUpdate: "messageUpdate",
	messageUpdated: "messageUpdated",
	presenceUpdate: "presenceUpdate",
	userPresenceUpdate: "presenceUpdate",
	rawWS: "rawWS",
	WSRaw: "rawWS",
	ready: "ready",
	relationshipAdd: "relationshipAdd",
	relationshipCreate: "relationshipAdd",
	relationshipRemove: "relationshipRemove",
	relationshipDelete: "relationshipRemove",
	relationshipUpdate: "relationshipUpdate",
	relationshipUpdated: "relationshipUpdate",
	shardDisconnect: "shardDisconnect",
	shardDisconnected: "shardDisconnect",
	shardPreReady: "shardPreReady",
	shardReady: "shardReady",
	shardConnect: "shardReady",
	shardConnected: "shardReady",
	shardResume: "shardResume",
	shardResumed: "shardResume",
	typingStart: "typingStart",
	unavailableGuildCreate: "unavailableGuildCreate",
	unavailableGuildAdd: "unavailableGuildCreate",
	unknown: "unknown",
	userUpdate: "userUpdate",
	userUpdated: "userUpdate",
	voiceChannelJoin: "voiceChannelJoin",
	voiceJoin: "voiceChannelJoin",
	joinVoice: "voiceChannelJoin",
	voiceChannelLeave: "voiceChannelLeave",
	voiceLeave: "voiceChannelLeave",
	leaveVoice: "voiceChannelLeave",
	voiceChannelSwitch: "voiceChannelSwitch",
	voiceSwitch: "voiceChannelSwitch",
	switchVoice: "voiceChannelSwitch",
	voiceStateUpdate: "voiceStateUpdate",
	voiceUpdate: "voiceStateUpdate",
	updateVoice: "voiceStateUpdate",
	warn: "warn",
	warning: "warn"
};

module.exports = (wiggle, ...callback) => {
	const middleware = { type: "global" };
	if(wiggle instanceof Category) middleware.category = wiggle.name;

	if(typeof callback[0] !== "function") {
		if(callback.length > 2) return callback.slice(1).map(cb => module.exports(wiggle, callback[0], cb));
		if(events[callback[0]]) {
			middleware.type = "event";
			middleware.event = events[callback[0]];
			wiggle._listen(middleware.event);
		} else if(callback[0] instanceof Command) {
			middleware.type = "command";
			middleware.command = callback[0];
			middleware.name = callback[0].name;
			callback.push(callback[0].run);
		} else if(callback[0] instanceof Category) {
			middleware.type = "category";
			middleware.category = callback[0];
			middleware.name = callback[0].name;

			if(!callback[1]) {
				callback[0].commands.forEach((command, name) => {
					callback[0].commands.set(name, new Command(wiggle, name, ...command));
					callback[0]._middleware = callback[0]._middleware.concat(
						callback[0].commands.map(cmd => module.exports(wiggle, cmd))
					);
				});

				return middleware;
			}
		} else if(typeof callback[0] === "string" && wiggle._middleware &&
				wiggle._middleware.find(mid => mid.name === callback[0])) {
			const target = wiggle._middleware.find(mid => mid.name === callback[0]);
			return module.exports(wiggle, target.category || target.command, ...callback.slice(1));
		} else {
			middleware.type = "unknown";
			middleware.name = callback[0].name || callback[0];
		}

		callback.shift();
	} else if(callback.length > 1) {
		return callback.map(cb => module.exports(wiggle, cb));
	}

	middleware._function = callback[0];
	return middleware;
};
