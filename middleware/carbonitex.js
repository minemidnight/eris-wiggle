const superagent = require("superagent");
const post = async (guild, next, wiggle) => {
	await superagent.post(`https://www.carbonitex.net/discord/data/botdata.php`)
		.send({
			key: siteKey,
			servercount: guild.shard.client.guilds.filter(gu => gu.shard.id === guild.shard.id).length,
			shardcount: guild.shard.client.options.maxShards,
			shardid: guild.shard.id
		})
		.catch(err => { }); // eslint-disable-line

	return next();
};

let siteKey;
module.exports = ({ key }) => {
	siteKey = key;
	return post;
};
