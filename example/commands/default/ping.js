module.exports = {
	run: async ({ message, reply, t }) => {
		if(!message.flags.https) {
			return t("ping.success", {
				ms: message.channel.guild ?
					message.channel.guild.shard.latency :
					message.channel._client.shards.get(0).latency
			});
		} else {
			const now = Date.now();
			const msg = await reply(t("ping.success", { ms: "pinging..." }));
			msg.edit(t("ping.success", { ms: Date.now() - now }));
			return undefined;
		}
	},
	flags: [{
		name: "https",
		type: "boolean",
		short: "h",
		default: false,
		aliases: ["http"]
	}]
};
