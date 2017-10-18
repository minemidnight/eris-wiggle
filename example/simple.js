const wiggle = require("../index");
const client = wiggle();
client.set("owner", "155112606661607425");
client.set("prefixes", ["mention", "!"]);
client.set("token", "token");
client.use("message", wiggle.middleware.commandParser());

client.use("ready", next => {
	client.erisClient.editStatus("online", { name: "Hello!" });

	next();
});

client.use("ping", (message, next) => {
	console.log("Ping middleware");

	next();
});

client.command("ping", { sendTyping: true, replyResult: true }, context => {
	console.log("Ping handler");
	return "Pong!";
});

const creator = wiggle.Category("creator"); // eslint-disable-line new-cap
creator.use((message, next) => {
	console.log("Creator middleware");
	if(message.author.id === client.get("owner")) next();
	else message.channel.createMessage("You cant use this! Its creator only");
});

const util = require("util");
creator.command("eval", { replyResult: true, caseSensitive: true }, async ({ message }) => {
	let guild = message.channel.guild, channel = message.channel, author = message.author, member = message.member; // eslint-disable-line

	try {
		let output = await eval(`(async function(){${message.content.replace(/“|”/g, "\"")}}).call()`);
		output = util.inspect(output, { depth: 0 }).substring(0, 1900);
		return `:white_check_mark: **Output:** \`\`\`js\n${output}\n\`\`\``;
	} catch(error) {
		return `:x: **Error:** \`\`\`\n${error}\n\`\`\``;
	}
});

client.use(creator);

client.connect();
process.on("unhandledRejection", err => console.error(err.stack));
