# Eris Wiggle
Command Router made for Eris

## Wiggle
Creating a Wiggle Instance
* Creation: call the function returned by `require("eris-wiggle")`
* ex:
```js
const wiggle = require("eris-wiggle");
const client = wiggle();
```
* If the function is called with an object, `<Wiggle>.set` is called with each key-value pair.

Wiggle Properties:
* commands\<Map>
	* Commands registered using `<Wiggle>.command(...)`
	* Do not belong to any category
* categories\<Object>
	* Categories being used by the Wiggle Instance
	* Each category is added once `<Wiggle>.use(category)` is called
* erisClient\<Map>
	* Eris Discord Client.
	* Property set once `<Wiggle>.set("token", <token>)` is called
* locals\<Object>
	* Object that can be used to pass values across code
	* Good alternative to using `global` or similar things

Wiggle Methods:
* connect()
	* Equivalent to `<Wiggle>.erisClient.connect()`
	* Returns: instance of Wiggle that the method was called on
* command(name\<String>, _options\<Object>_, runFunction\<Function (context)>)
	* Creates a command registered under the Wiggle instance, then uses it
	* Recommended to use categories over this
	* Returns: instance of Wiggle that the method was called on
* get(name\<String>)
	* Equivalent to `<Wiggle>.locals.options.<key>`
	* Returns: value of the option `name` which was set by `<Wiggle>.set(name, value)`
* set(options\<Object>)
	* `<Wiggle>.set(name, value)` is called for every key-value pair 
* set(name\<String>, value\<*>)
	* Sets the option `name` to `value`
	* Options:
		* token\<String> - Creates a Eris client with the token `value` and sets `<Wiggle>.erisClient` to the new client
		* commands\<Map> - Directory where commands are, composed of other directories containing JavaScript files which become commands. See advanced example for more information
		* listeners\<String> - Directory where listeners are, with file names of event names. Each listener is used via `<Wiggle>.use`
		* locales\<String> - Directory of locales to use, each file name should be that of the locale
		* clientOptions\<Object> - Options used when constructing Eris client
		* commandOptions\<Object> - Default command options to use when creating commands
		* localeFunction\<Function(message\<Message>)> - Function expecting `message.locale` and `message.channel.guild.locale` if applicable to be set, for usage with `message.t` (read about locales below)
		* prefixes\<Array\<String>> - Prefixes used by the command parser middleware. Each string is turned into a regular expression. Not case  sensitive
		* getPrefixes\<Function(message\<Message>)> - Expects a return of an array of strings (parsed as regular expresions, not case sensitive) of prefixes that should be used, based off the context of the message. If not defined, the `prefixes` option will be used
		* escapePrefixes\<Boolean> - Whether or not to escape prefixes (default true)
		* All other options are **not** used internally, but may be used inside of code. `<Wiggle>.locals` may be a better option rather than using `.set` if you are not using one of the options.
	* Returns: instance of Wiggle that the method was called on
* use(...middleware\<*>)
	* Middleware can be a variety of different things
		* (\<Function(_...params\<*>_, next\<Function()>, wiggle\<Wiggle>)>) - Function gets called every time a registered event happens. Not recommended to use
		* (eventName\<String> \<Function(...params\<*>, next\<Function()>, wiggle\<Wiggle>)>) - Function gets called each time the event happens
		* (\<Category>) - Registers all the commands inside of a category
		* (\<Category|String>, \<Function(message\<Object>, next\<Function()>, wiggle\<Wiggle>)>) - Function gets called each time a command from the category is used. Category can also be a string of the name of the category as long as `<WiggleInstace>.use(<Category>)` was called first
		* (\<Command|String>, \<Function(message\<Object>, next\<Function()>, wiggle\<Wiggle>)>) - Function gets called each the command is used. Command can also be a string of the name of the command
		* All functions can be replaced with a object, with the keys `middleware` for the function and `priority` to set the function priority (default 1)
		* If multiple functions are used with the middleware, they will all be used as middlewares for the same thing (ex: `client.use("message", fn1, fn2)` will both go to message)
	* `...params` represents all the parameters of the Eris event in use
	* The **next** parameter
		* When called, it moves onto the next middleware function.
		* If next isn't called, the middleware cycle ends
		* Accepts no parameters
	* The order of middlware functions executed is as follows
		* Middlewares with a priority >= 50
		* All category or command middlewares (not the executing of them)
		* The rest, besides commands, in order of which they were added
		* All commands are last (the execution of them)
		* Each middleware is sorted by priority, then the order in which they were added
	* Built in middleware
		* Accessing: `wiggle.middleware` is an object of middlewares built in (not a instance of wiggle, but what is returned from `require("eris-wiggle")`)
		* Usage: each middleware in the built in middleware is a function which returns a middleware function to be used (ex: `client.use("message", wiggle.middleware.commandParser())`)
		* argHandler\<Function()>
			* Parses arguments into their correct types based off user input
			* Adds a `message.args` property (array of parsed arguments)
			* Not guaranteed to call the `next` callback, if a user gives invald input or not enough arguments, the command responds with a error
			* Use with `message` event
		* dbots, dbotsOrg, carbonitex \<Function(\<Object{key:\<String>}>)>
			* Posts server count to appropriate site (https://bots.discord.pw, https://discordbots.org, https://carbonitex.net). Works regardless if the bot is split up across seperate processes, or just one
			* Parameter should be a object with the field key, giving the api key to send the post request (ex: `{ key: "api key here" }`)
			* Always calls the `next` callback
			* Use with `guildCreate` and/or `guildDelete` events
			* Require the superagent package to work
		* commandParser\<Object {middle:\<Function()>, priority: 99}>
			* Highly recommended to use, unless you know what you are doing
			* Sets the `message.command` property of the command used with the message, if these is one
			* Always calls the `next` callback, regardless if the message had a command or not
			* Use with `message` event
			* Priority of 99
	* Returns: instance of Wiggle that the method was called on

## Categories
Categories are a set of commands, grouped together by similarties. For example, `kick`, `ban` and `mute` might be a moderator category. Categories with `eris-wiggle` are made simple.

Creating a category:
* Accessing: `wiggle.Category(...params)` is a function that returns a new instance of a category. All of the parameters are passed to the constructor (not a instance of wiggle, but what is returned from `require("eris-wiggle")`)
* Constructor parameters: (name\<String>, _commandOptions\<Object>_)
	* Command options: an object that sets default comamnd options to all commands within the category

Properties:
* locals\<Object>
	* Same concept as `<Wiggle>.locals`
* commands\<Map>
	* All commands registered under the category
* name\<String>
	* Name of category

Methods:
* name(name\<String>)
	* Sets the `name` property of the category
	* Returns: the category that the method was called on
* command(name\<String>, _options\<Object>_, runFunction\<Function (context)>)
	* Creates a comamnd under the category
	* Returns: the category that the method was called on
* use(...middleware\<Function(message\<Object></Object>, next\<Function()>, wiggle\<Wiggle>)>)
	* Uses the middleware each time a command from the category is ran

Categories created are only initiated once `<Wiggle>.use(<Category>)` is called

## Subcommands
Subcommands are a series of commands within commands.
* Usage: `<Category>.use(<Category>)`

Commands should be registered to the category being passed to `.use()` before calling it. When using the `commands` option to register commands, create a folder instead of a file, and fill that folder with the subcommands. This file should be the normal format of a command (see example). Any subcommands with the same name as the category containing the subcommand will be used if there was no subcommand or an invalid sub command (used as the default command). If \<Category>.aliases is set, it will be used as aliases for the subcategory. To set aliases using `<Wiggle>.set("commands", ...)`, make a file named `aliases.js` exporting an array of aliases or `aliases.json` containing an array of aliases.

Subcommands are accessible through the following:
`<Category>.subcommands`

## Commands
Commands are made using `<Wiggle>.command(...)` or `<Category>.command(...)`

Constructor options (all optional):
* aliases\<Array\<String>>
	* Array of aliases to accept
	* Default value: `[]`
* args\<Array\<Object>>
	* Array of arguments to use
	* Argument handler middleware information:
		* Requires field type\<String>:
			* Type of argument to use
			* Supported types:
				* `boolean` - returns a boolean
				* `channel` - returns a channel (voice or text)
				* `emoji` - returns a emoji object with fields `name`, `id` and `url`
				* `float` - returns a float
					* Accepts `min` and `max` options
				* `image` - returns a image url based off attachments, link, emoji, or user avatar
				* `int` - returns an integer
					* Accepts `min` and `max` options
				* `invite` - returns a invite object, as returned from `<ErisClient>.getInvite`
				* `link` - returns a link
				* `member` - returns a member from the server the command was executed in
				* `role` - returns a role
				* `text` - returns the plain input
				* `textChannel` - returns a text channel
				* `user` - returns a user
				* `voiceChannel` - returns a voice channel
				* If a type cannot be resolved, the client responds with a error message
		* Optional fields:
			* label\<String>
				* Label to use when constructing `<Command>.usage`
				* Default value: argument type
			* optional\<Boolean>
				* Whether or not the argument is optional
				* Default value: `false`
			* Other fields can be added. Extra ones will be used as options when resolving types (ex. `min` and `max` fields for `int` and `float` types)
		* Upon execution, `<Message>.args` will be an array containing the arguments resolved to their types
	* Default value: `[]`
* caseSensitive\<Boolean>
	* Whether or not the command input is case sensitive
	* If false, `<Message>.content` is converted to lower case
	* Default value: `false`
* flags\<Array\<Object>>
	* Array of flags to use
	* Required fields:
		* name\<String> - name of flag (must be unique amongst other flags. can use `-`)
		* type\<String> - same as argument type
	* Optional fields:
		* short\<String> - shortname option for the flag (can be used as an alias instead)
		* aliases\<Array\<String>> - array of aliases to also use
		* default\<*> - the default value to be passed to the resolver if no value is given
		* array\<Boolean> - if the value should be an array, regardless if only 1 input was provided
	* Default value: `[]`
* guildOnly\<Boolean>
	* Whether or not this command may only be executed in guilds
	* Default value: `false`
* replyResult\<Boolean>
	* If true, `<context>.reply` is called with the return value from the run function of the command
	* Default value: `false`
* cooldown\<Array|Object|Number>
	* Sets a command's cooldown
	* Can be set to be a certain amount of uses per certain time
	* If an array, the format should be as such: `[time (ms), uses]`
	* If an object, it should be as such; `{ time: <time in ms>, uses: <uses> }`
	* If a number, it should represent the amount of ms between every 1 use
* Any other option can be specified, but they are not used for anything. Can be used to pass extra data trhough a command

Properties:
* locals\<Object>
	* Same concept as `<Wiggle>.locals`
* name\<String>, aliases\<Array\<String>>, args\<Array\<Object>>, caseSensitive\<Boolean>, guildOnly\<Boolean>, _...etc_
	* The values of the corresponding option
* category\<String>
	* Category that the command belongs to
	* If registered using `<Wiggle>.command`, it is `default`
* usage\<String>
	* String constructed based off command arguments and flags
	* Contains usage of command, eg `[]`, `<text>`, `[text]`, `<user> [text]`, etc
	* Example with flags: `<text> ...--time|-t [int=5]`

The command run function is called with a parameter: 
* Context\<Object>
	* Object containing useful properties
	* args\<Array\<*>>
		* An array of command arguments
		* Reference to message.args
	* author\<Object>
		* Author of message
		* Reference to message.author
	* category\<String>
		* Category of command used
		* Reference to message.command.category
	* channel\<Object>
		* Channel the messsage was sent in
		* Reference to message.channel
	* flags\<Object>
		* Flags used in the message (keys are flag names, values are flag values)
		* Reference to message.flags
	* guild\<Object>
		* Guild the message was sent in
		* Reference to message.channel.guild
	* message\<Object>
		* The message that was sent
	* reply\<Function(content\<Object|String>, file\<Object>)>
		* Function that does the same as message.channel.createMessage with few differences
		* Accepts a file as the first parameter if there is no content
		* Accepts an array as the first argument, which will then make the first argument the first element, and the second the second element (useful when using replyResult option)
	* resolver\<Object>
		* Object filled with functions
		* Resolves input to certain types
	* t\<Function(...)>
		* Read about locales below for more information
		* Reference to message.t
	* wiggle
		* Reference to the wiggle instance attached to the command

## Locales
Locales are a way to define the language of a user. eris-wiggle has built-in support for easy implementation of locales.

To use locales, create a folder containg files of each locale, or a folder of folders of files which are all bundled together. Each file should be named the name of the locale it corresponds to. For example, for an English locale, the file would be `en.json`.

The locale file:
* The locale file's key-value pairs should be of "context" and the message
* Message that have data should have a placeholder with `{{placeholderName}}` which will be replaced later
* Files can be JSON or Javascript
* ex:
```json
{
	"commands.ping": "Pong! `{{latency}}ms`",
	"commands.kick.noPerms": "You have no permission to kick that user"
}
```
* Extra options:
	* `imports`\<Array> field - array of files to import into the current locale file, all relative
	* `prefix`\<String> field - appends the prefix to each key

Now, actually using locales is very simple. When a message is sent, `message.t` and `message.channel.guild.t` are both added to it, allowing you to use locales with ease.

These functions accept 2 parameters:
* context\<Path>
	* The context (field) of the file message
* data\<Object>
	* Each key should be the placeholder name
	* Each value should be the value of the corresponding placeholder
	* Default value: `{}`
* ex (extending usage of the example file above):
```js
const wiggle = require("eris-wiggle");
const client = wiggle();
client.set("locales", "locales");
client.command("ping", { replyResult: true }, ctx => {
	return ctx.message.t("commands.ping", { latency: ctx.guild.shard.latency });
});
```

`message.channel.guild.t` is identical to `message.t` but exists in case you want to base a response based off a guild-wide locale.

If you want to change the locale that the `t` function uses, use the option `localeFunction` with your wiggle instance, to change the properties `message.locale` and `message.channel.guild.locale` to their proper values, based off the message sent.

The default locale used is always `en`. If a placeholder is missing or the context is invalid, the function will try again with the locale `en`. If it still doesnt work, then a error will be returned. If a placeholder is missing, an error will take its place.

Wiggle also uses locales for its resolver errors, so if you want to add support for more languages, send a pull request. If you are trying to use a `ru` (Russian) locale for example, and wiggle does not support it, it's messages will remain in English.
