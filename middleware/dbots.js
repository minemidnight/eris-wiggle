const superagent = require("superagent");
const post = async (guild, next, wiggle) => {
	await superagent.post(`https://bots.discord.pw/api/bots/${wiggle.erisClient.user.id}/stats`)
		.set("Authorization", siteKey)
		.send({
			server_count: guild.shard.client.guilds.filter(guild2 => guild.shard.id === guild2.shard.id), // eslint-disable-line camelcase, max-len
			shard_count: guild.shard.client.options.maxShards, // eslint-disable-line camelcase
			shard_id: guild.shard.id // eslint-disable-line camelcase
		})
		.catch(err => { }); // eslint-disable-line
};

let siteKey;
module.exports = ({ key }) => {
	siteKey = key;
	return post;
};
