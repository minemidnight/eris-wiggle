module.exports = {
	run: ({ message }) => `_${message.t("say.success", { word: message.args[0] || message.t("words.nothing") })}_`,
	args: [{ type: "text", label: "word", optional: true }]
};
