const wiggle = require("../index");
const client = wiggle();
client.set("owner", "155112606661607425");
client.set("prefixes", ["mention", "!"]);
client.set("token", "token");
client.set("commandOptions", { sendTyping: true, replyResult: true });

client.use("message", wiggle.middleware.commandParser());
client.set("commands", "example/commands");
client.use("ready", next => {
	client.erisClient.editStatus("online", { name: "Testing!" });
});


client.categories.get("creator").use((message, next) => {
	console.log("Creator middleware");
	if(message.author.id === client.get("owner")) next();
	else message.channel.createMessage("You cant use this! Its creator only");
});

client.connect();
process.on("unhandledRejection", err => console.error(err.stack));
