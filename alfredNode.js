// === WorkFlow ===
var Workflow = (function() {
    var _items = [];
    var _name = "AlfredWfNodeJs";
    var handlers = {};
    return {
        setName: function(name) {
            _name = name;
        },

        getName: function() {
            return _name;
        },

        addItem: function(item) {
            _items.push(item.feedback());
        },

        clearItems: function() {
            _items = [];
        },

        feedback: function() {
            var root = require('xmlbuilder').create('root', {
                version: '1.0',
                encoding: 'UTF-8'
            });

            var ele = root.ele({
                items: _items
            });
            var ret = ele.end();
            console.log(ret);
            return ret;
        },

        registerActionHandler: function(action, handler) {
            handlers[action] = handler;
        },
    };
})();

// === Action Handler ===
var ActionHandler = (function() {
    var events = require('events');
    var eventEmitter = new events.EventEmitter();
    return {
        onAction: function(action, handler) {
            if (!action || !handler) {
                return;
            }
            eventEmitter.on("action-" + action, handler);
        },

        onSubAction: function(action, handler) {
            if (!action || !handler) {
                return;
            }
            eventEmitter.on("subAction-" + action, handler);
        },

        handle: function(action, query) {
            if (query.indexOf(Utils.SUB_ACTION_SEPARATOR) === -1) {
                // handle action
                eventEmitter.emit("action-" + action, query);
            } else {
                // handle sub action
                var tmp = query.split(Utils.SUB_ACTION_SEPARATOR);
                var selectedItem = tmp[0].trim();
                query = tmp[1];
                eventEmitter.emit("subAction-" + action, selectedItem, query);
            }
        },

        clear: function() {
            eventEmitter.removeAllListeners();
        }
    };
})();

// === Item ===
function Item(data) {
    // ignore empty value
    data = _removeEmptyProperties(data);

    for (var key in data) {
        this[key] = data[key];
    }
}

Item.prototype.feedback = function() {
    var item = _removeEmptyProperties({
        "@uid": this.uid,
        "@arg": this.arg,
        "@valid": this.valid === true ? "YES" : "NO",
        "@autocomplete": this.autocomplete,
        "title": this.title,
        "subtitle": this.subtitle,
        "icon": this.icon
    });

    return {
        item: item
    };
};

// === Storage
var Storage = (function() {
    var storage = require('node-persist');
    storage.initSync();

    return {
        set: function(key, value, ttl) {
            var obj = {
                data: value,
                timestamp: new Date().getTime(),
                ttl: ttl || -1
            };

            storage.setItemSync(key, obj);
        },

        get: function(key) {
            var obj = storage.getItemSync(key);
            if (obj) {
                var ttl = obj.ttl;
                var timestamp = obj.timestamp;
                // if not ttl => return obj
                if (ttl === -1) {
                    return obj.data;
                } else {
                    // check ttl
                    var now = new Date().getTime();
                    if (now - timestamp < ttl) {
                        return obj.data;
                    } else {
                        storage.removeItemSync(key, function() {});
                    }
                }
            }
        },

        remove: function(key) {
            if (storage.getItem(key)) {
                storage.removeItemSync(key, function() {});
            }
        },

        clear: function() {
            storage.clearSync();
        }
    };
})();

// === Settings
var Settings = (function() {
    var keychain = require('keychain');

    return {
        set: function(key, value) {
            var settings = Storage.get("settings");
            settings = settings || {};
            settings[key] = value;
            Storage.set("settings", settings);
        },

        get: function(key) {
            var settings = Storage.get("settings");
            if (settings) {
                return settings[key];
            }
        },

        remove: function(key) {
            var settings = Storage.get("settings");
            if (settings) {
                delete settings[key];
            }
        },

        clear: function() {
            Storage.remove("settings");
        },

        setPassword: function(username, password) {
            keychain.setPassword({
                account: username,
                service: Workflow.getName(),
                password: password
            }, function(err) {
                console.log(err);
            });
        },

        getPassword: function(username, callback) {
            keychain.getPassword({
                account: username,
                service: Workflow.getName()
            }, callback);
        }
    };
})();

// === Utils
var Utils = (function() {
    var fuzzy = require('fuzzy');
    var applescript = require('node-osascript');
    return {
        SUB_ACTION_SEPARATOR: ">",

        filter: function(query, list, keyBuilder) {
            if (!query) {
                return list;
            }

            var options = {
                extract: keyBuilder
            };

            return fuzzy.filter(query, list, options).map(function(item) {
                return item.original;
            });
        },

        /**
         * a wrapper of "applescript" module
         * @type {Object}
         */
        applescript: {
            /**
             * execute script
             * @param script
             * @param handler: function(err, result)
             */
            execute: function(script, handler) {
                console.log("1111111");
                applescript.execute(script, handler);
            },

            /**
             * execute script file
             * @param path to script file
             * @param variable variable
             * @param handler: function(err, result, raw)
             */
            executeFile: function(path, varibale, handler) {
                applescript.execute.apply(this, arguments);
            }
        }
    };
})();

// === private functions
function _removeEmptyProperties(data) {
    for (var key in data) {
        var value = data[key];
        if (value === undefined || value === null) {
            delete data[key];
        }
    }

    return data;
}

// module export
module.exports = {
    storage: Storage,
    workflow: Workflow,
    actionHandler: ActionHandler,
    settings: Settings,
    Item: Item,
    utils: Utils,
    run: function() {
        var action = process.argv[2];
        var query = process.argv[3];
        ActionHandler.handle(action, query);
    }
};
