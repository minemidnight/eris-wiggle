const fs = require("fs");
const path = require("path");

class Locale {
	constructor(resolvedPath) {
		const isDirectory = fs.lstatSync(resolvedPath).isDirectory();
		let files = [];

		if(isDirectory) {
			fs.readdirSync(resolvedPath)
				.filter(file => ~[".js", ".json"].indexOf(path.extname(file)))
				.map(file => path.resolve(resolvedPath, file))
				.filter(file => !fs.lstatSync(file).isDirectory())
				.forEach(file => files.push(require(file)));
		} else {
			files.push(require(resolvedPath));
			resolvedPath = path.resolve(resolvedPath, "../");
		}

		files.filter(data => data.imports).forEach(data => {
			data.imports.forEach(imp => files.push(require(path.resolve(resolvedPath, imp))));
			delete data.imports;
		});

		files = files.map(data => {
			if(!data.prefix) return data;
			return Object.entries(data).reduce((newData, [key, value]) => {
				if(~["imports", "prefix"].indexOf(key)) return newData;
				newData[data.prefix + key] = value;
				return newData;
			}, {});
		});

		this._data = Object.assign(...files);
	}

	get(context) {
		return this._data[context];
	}
}

module.exports = Locale;
