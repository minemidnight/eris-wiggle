const wiggle = require("../index");
const client = wiggle();
client.set("owner", "155112606661607425")
	.set("prefixes", ["mention", "!"])
	.set("token", "token here")
	.set("commandOptions", { sendTyping: true, replyResult: true, embedError: true })
	.use("message", wiggle.middleware.commandParser(), wiggle.middleware.argHandler())
	.set("commands", "commands")
	.set("locales", "locales")
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
