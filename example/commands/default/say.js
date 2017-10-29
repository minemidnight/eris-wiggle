module.exports = {
	run: ({ message }) => message.t("say.success", { word: message.args[0] || message.t("words.nothing") }),
	args: [{ type: "text", label: "word", optional: true }]
};
