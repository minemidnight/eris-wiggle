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

		let file = files.find(data => data.imports);
		while(file) {
			file.imports.forEach(imp => {
				const data = require(path.resolve(resolvedPath, imp));
				if(file.prefix) {
					if(data.prefix) data.prefix += file.prefix;
					else data.prefix = file.prefix;
				}

				files.push(data);
			});
			delete file.imports;

			file = files.find(data => data.imports);
		}

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

	merge(locale) {
		this._data = Object.assign(this._data, locale._data);

		return this;
	}
}

module.exports = Locale;
