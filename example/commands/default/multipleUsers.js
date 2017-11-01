module.exports = {
	run: ({ message }) => message.flags.users.map(user => user.username).join("\n"),
	flags: [{
		array: true,
		name: "users",
		type: "user",
		short: "u"
	}]
};
