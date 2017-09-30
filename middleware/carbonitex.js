const superagent = require("superagent");
const post = async (guild, next, wiggle) => {
	await superagent.post(`https://www.carbonitex.net/discord/data/botdata.php`)
		.send({
			key: siteKey,
			servercount: guild.shard.client.guilds.filter(guild2 => guild.shard.id === guild2.shard.id), // eslint-disable-line camelcase, max-len
			shardcount: guild.shard.client.options.maxShards, // eslint-disable-line camelcase
			shardid: guild.shard.id // eslint-disable-line camelcase
		})
		.catch(err => { }); // eslint-disable-line
};

let siteKey;
module.exports = ({ key }) => {
	siteKey = key;
	return post;
};
