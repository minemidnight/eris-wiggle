const util = require("util");
module.exports = {
	run: async ctx => {
		const { message } = ctx;
		let guild = message.channel.guild, channel = message.channel, author = message.author, member = message.member; // eslint-disable-line

		try {
			let output = await eval(`(async function(){${message.content.replace(/“|”/g, "\"")}}).call()`);
			output = util.inspect(output, { depth: 0 }).substring(0, 1900);
			return `:white_check_mark: **Output:** \`\`\`js\n${output}\n\`\`\``;
		} catch(error) {
			return `:x: **Error:** \`\`\`\n${error}\n\`\`\``;
		}
	},
	args: [{ type: "text", label: "input" }],
	caseSensitive: true
};
