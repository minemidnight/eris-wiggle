module.exports = {
	run: ({ message }) => message.t("ping.success", {
		ms: message.channel.guild ?
			message.channel.guild.shard.latency :
			message.channel._client.shards.get(0).latency
	})
};
