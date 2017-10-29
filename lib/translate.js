const t = (locale = "en", context, data = {}, wiggle) => {
	if(!wiggle._locales.has(locale)) {
		if(locale === "en") throw new Error("No bot locale found for English");
		else return t("en", context, data, wiggle);
	}

	const message = wiggle._locales.get(locale).get(context);
	if(!message) return t(locale, "wiggle.locale.invalidContext", { context }, wiggle);

	const placeholders = message.match(/{{[^{}]+}}/g);
	return placeholders ?
		placeholders.map(placeholder => placeholder.substring(2, placeholder.length - 2)).reduce((msg, placeholder) => {
			if(data[placeholder] === undefined) {
				data[placeholder] = t(locale, "wiggle.locale.invalidPlaceholder", { placeholder }, wiggle);
			}

			return msg.replace(new RegExp(`{{${placeholder}}}`, "gi"), data[placeholder]);
		}, message) :
		message;
};


module.exports = t;
