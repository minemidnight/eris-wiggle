const wiggle = require("../index");
const client = wiggle({
	owner: "155112606661607425",
	prefixes: ["mention", "!"],
	token: "token here",
	commandOptions: { sendTyping: true, replyResult: true },
	commands: "example/commands",
	locales: "example/locales"
});

client.use("message", wiggle.middleware.commandParser(), wiggle.middleware.argHandler())
	.use("ready", next => {
		client.erisClient.editStatus("online", { name: "Testing!" });
		next();
	});

client.use("creator", (message, next) => {
	console.log("Creator middleware");
	if(message.author.id === client.get("owner")) next();
	else message.channel.createMessage("You cant use this! Its creator only");
});

client.connect();
process.on("unhandledRejection", err => console.error(err.stack));
