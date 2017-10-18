const util = require("util");
module.exports = {
	run: async ctx => {
		const { message } = ctx;

		try {
			let output = await eval(`(async function(){${message.args[0].replace(/“|”/g, "\"")}}).call()`);
			output = util.inspect(output, { depth: 0 }).substring(0, 1900);
			return `:white_check_mark: **Output:** \`\`\`js\n${output}\n\`\`\``;
		} catch(error) {
			return `:x: **Error:** \`\`\`\n${error}\n\`\`\``;
		}
	},
	args: [{ type: "text", label: "input" }],
	caseSensitive: true
};
