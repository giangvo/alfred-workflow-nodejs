const exec = require('child_process').exec;
const _ = require('underscore');
const utils = require("util");
// === WorkFlow ===

const Workflow = (function() {
    let _items = [];
    const _name = "AlfredWfNodeJs";
    const handlers = {};
    const clearItems = function() {
        _items = [];
        clearItemsData();
    };

    const addItem = function(item) {
        saveItemData(item);

        if (item.hasSubItems) {
            item.autocomplete = item.title + Utils.SUB_ACTION_SEPARATOR;
        }

        _items.push(item.feedback());
    };

    const feedback = function() {

        const usage = Storage.get("usage") || {};

        _.each(_items, function(item) {
            const title = item.title;
            item.count = usage[title] ? (0 - usage[title]) : 0;
        });

        const sortedItems = _.sortBy(_items, "count");

        _.each(sortedItems, function(item) {
            delete item.count;
        });

        const ret = JSON.stringify({
            items: sortedItems
        });

        console.log(ret);
        return ret;
    };

    return {
        /**
         * Set workflow name
         */
        setName: function(name) {
            _name = name;
        },

        /**
         * Get workflow name
         */
        getName: function() {
            return _name;
        },

        /**
         * Add feedback item
         */
        addItem: addItem,

        /**
         * Clear all feedback items
         */
        clearItems: clearItems,

        /**
         * Generate feedbacks
         */
        feedback: feedback,

        /**
         * Generate info fedback
         */
        info: function(title, subtitle) {
            clearItems();
            addItem(new Item({
                title: title,
                subtitle: subtitle,
                icon: ICONS.INFO
            }));

            return feedback();
        },

        /**
         * Generate warning feedback
         */
        warning: function(title, subtitle) {
            clearItems();
            addItem(new Item({
                title: title,
                subtitle: subtitle,
                icon: ICONS.WARNING
            }));

            return feedback();
        },

        /**
         * Generate error feedback
         */
        error: function(title, subtitle) {
            clearItems();
            addItem(new Item({
                title: title,
                subtitle: subtitle,
                icon: ICONS.ERROR
            }));

            return feedback();
        }
    };
})();

// === Action Handler ===
const ActionHandler = (function() {
    const events = require('events');
    const eventEmitter = new events.EventEmitter();
    return {
        /**
         * Register action handler
         */
        onAction: function(action, handler) {
            if (!action || !handler) {
                return;
            }
            eventEmitter.on("action-" + action, handler);
        },

        /**
         * Register menu item selected handler
         */
        onMenuItemSelected: function(action, handler) {
            if (!action || !handler) {
                return;
            }
            eventEmitter.on("menuItemSelected-" + action, handler);
        },

        /**
         * Handle action by delegate to registered action/menuItem handlers
         */
        handle: function(action, query) {
            if (!query || query.indexOf(Utils.SUB_ACTION_SEPARATOR) === -1) {
                // handle action
                eventEmitter.emit("action-" + action, query);
            } else {
                // handle sub action
                const tmp = query.split(Utils.SUB_ACTION_SEPARATOR);
                const selectedItemTitle = tmp[0].trim();
                query = tmp[1].trim();

                saveUsage(query, selectedItemTitle);

                eventEmitter.emit("menuItemSelected-" + action, query, selectedItemTitle, getItemData(selectedItemTitle));
            }
        },

        /**
         * Unregister all action handlers
         */
        clear: function() {
            eventEmitter.removeAllListeners();
        }
    };
})();

// === Feedback Item ===
function Item(data) {
    // ignore empty value
    data = _removeEmptyProperties(data);

    for (const key in data) {
        this[key] = data[key];
    }
}

/**
 * Generate feedback for a item
 */
Item.prototype.feedback = function() {
    this.arg = _updateArg(this.arg);

    const item = _removeEmptyProperties({
        "uid": this.uid,
        "arg": this.arg,
        "valid": this.valid === true ? "YES" : "NO",
        "autocomplete": this.autocomplete,
        "title": this.title,
        "subtitle": this.subtitle,
        "type": this.type,
        "icon": {
            "path": this.icon
        },
        "quicklookurl": this.quicklookurl,
        "text": this.text,
        "mods": this.mods
    });

    return item;
};

// === Storage
const Storage = (function() {
    const storage = require('node-persist');
    storage.initSync();

    return {
        set: function(key, value, ttl) {
            const obj = {
                data: value,
                timestamp: new Date().getTime(),
                ttl: ttl || -1
            };

            storage.setItemSync(key, obj);
        },

        get: function(key) {
            const obj = storage.getItemSync(key);
            if (obj) {
                const ttl = obj.ttl;
                const timestamp = obj.timestamp;
                // if not ttl => return obj
                if (ttl === -1) {
                    return obj.data;
                } else {
                    // check ttl
                    const now = new Date().getTime();
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
const Settings = (function() {
    const keychain = require('keychain');

    return {
        set: function(key, value) {
            const settings = Storage.get("settings") || {};
            settings[key] = value;
            Storage.set("settings", settings);
        },

        get: function(key) {
            const settings = Storage.get("settings");
            if (settings) {
                return settings[key];
            }
        },

        remove: function(key) {
            const settings = Storage.get("settings");
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
const Utils = (function() {
    const fuzzy = require('fuzzy');
    const applescript = require('node-osascript');
    return {
        SUB_ACTION_SEPARATOR: " $>",

        filter: function(query, list, keyBuilder) {
            if (!query) {
                return list;
            }

            const options = {
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
                applescript.execute(script, handler);
            },

            /**
             * execute script file
             * @param path to script file
             * @param variable variable
             * @param handler: function(err, result, raw)
             */
            executeFile: function(path, varibale, handler) {
                applescript.executeFile.apply(this, arguments);
            }
        },


        /**
         * @param data: {arg: 'xyz', variables: {key: value}}
         * @return 
         *     string of '{"alfredworkflow": {"arg": "xyz", "variables": {"key": "value"}}}'
         *     or data if data is not type of object
         */
        generateVars: function(data) {
            const ret = _updateArg(data);
            console.log(ret);
            return ret;
        },

        envVars: {
            /**
             * Set enviroment variable
             * if value is object => store as json string
             */
            set: function(key, value) {
                if (key !== undefined && value !== undefined) {
                    if (typeof value === 'object') {
                        process.env.key = JSON.stringify(value);
                    } else {
                        process.env.key = value;
                    }
                }
            },

            /**
             * Get enviroment variable
             * if data is json => parse and return object
             */
            get: function(key) {
                return _toObjectIfJSONString(process.env[key]);
            }
        },

        wfVars: {
            /**
             * Set wf variable
             * @param key variable name
             * @param value variable value
             * @param callback callback(err)
             */
            set: function(key, value, callback) {
                if (key !== undefined && value !== undefined) {
                    // set variable to plist
                    const setCommand = utils.format('/usr/libexec/PlistBuddy -c "Set :variables:%s \"%s\"" info.plist', key, value);
                    exec(setCommand, function(err, stdout, stderr) {
                        // if variable is not in plist => add it to plist
                        if (err) {
                            const addCommand = utils.format('/usr/libexec/PlistBuddy -c "Add :variables:%s string \"%s\"" info.plist', key, value);
                            exec(addCommand, function(err, stdout, stderr) {
                                if (callback) {
                                    callback(_toUndefinedIfNull(err));
                                };
                            });
                        } else {
                            if (callback) {
                                callback(undefined);
                            };
                        }
                    })
                }
            },

            /**
             * @param key variable name
             * @param callback callback(err, value)
             * @return wf variable
             */
            get: function(key, callback) {
                const getCommand = utils.format('/usr/libexec/PlistBuddy -c "Print :variables:%s" info.plist', key);
                exec(getCommand, function(err, stdout, stderr) {
                    if (err) {
                        callback(err);
                    } else {
                        const value = stdout.trim();
                        callback(undefined, value);
                    }

                })
            },

            /**
             * Remove a variable from wf variables
             * @param key variable name
             * @param callback callback(err)
             */
            remove: function(key, callback) {
                const getCommand = utils.format('/usr/libexec/PlistBuddy -c "Delete :variables:%s" info.plist', key);
                exec(getCommand, function(err, stdout, stderr) {
                    if (callback) {
                        callback(_toUndefinedIfNull(err));
                    };
                })
            },

            /**
             * Use with caution!!!
             * clear all workflow variables
             * @param callback callback(err)
             */
            clear: function(callback) {
                const clearCommand = '/usr/libexec/PlistBuddy -c "Delete :variables" info.plist';
                exec(clearCommand, function(err, stdout, stderr) {
                    if (callback) {
                        callback(_toUndefinedIfNull(err))
                    };
                })
            }
        }

    };
})();

const ICONS = (function() {
    // mac icons root folder
    const ICON_ROOT = "/System/Library/CoreServices/CoreTypes.bundle/Contents/Resources/";

    return {
        ACCOUNT: ICON_ROOT + "Accounts.icns",
        BURN: ICON_ROOT + "BurningIcon.icns",
        CLOCK: ICON_ROOT + "Clock.icns",
        COLOR: ICON_ROOT + "ProfileBackgroundColor.icns",
        EJECT: ICON_ROOT + "EjectMediaIcon.icns",
        ERROR: ICON_ROOT + "AlertStopIcon.icns",
        FAVORITE: ICON_ROOT + "ToolbarFavoritesIcon.icns",
        GROUP: ICON_ROOT + "GroupIcon.icns",
        HELP: ICON_ROOT + "HelpIcon.icns",
        HOME: ICON_ROOT + "HomeFolderIcon.icns",
        INFO: ICON_ROOT + "ToolbarInfo.icns",
        NETWORK: ICON_ROOT + "GenericNetworkIcon.icns",
        NOTE: ICON_ROOT + "AlertNoteIcon.icns",
        SETTINGS: ICON_ROOT + "ToolbarAdvanced.icns",
        SWIRL: ICON_ROOT + "ErasingIcon.icns",
        SWITCH: ICON_ROOT + "General.icns",
        SYNC: ICON_ROOT + "Sync.icns",
        TRASH: ICON_ROOT + "TrashIcon.icns",
        USER: ICON_ROOT + "UserIcon.icns",
        WARNING: ICON_ROOT + "AlertCautionBadgeIcon.icns",
        WEB: ICON_ROOT + "BookmarkIcon.icns",
    };
})();

// === private functions
function _removeEmptyProperties(data) {
    for (const key in data) {
        let value = data[key];
        if (typeof value === 'object') {
            value = _removeEmptyProperties(value);
            if (!Object.keys(value).length) {
                value = null;
            }
        }
        if (value === undefined || value === null) {
            delete data[key];
        }
    }

    return data;
}

// save item data into storage as "item title" => item data
function saveItemData(item) {
    if (item.data) {
        const wfData = Storage.get("wfData") || {};
        wfData[item.title] = item.data;
        Storage.set("wfData", wfData);
    }
}

function clearItemsData(item) {
    Storage.remove("wfData");
}

function getItemData(itemTitle) {
    itemTitle = typeof itemTitle === "string" ? itemTitle.normalize() : itemTitle;
    const wfData = Storage.get("wfData");
    return wfData ? wfData[itemTitle] : undefined;
}

function saveUsage(query, itemTitle) {
    if (!query) {
        const usage = Storage.get("usage") || {};

        const count = usage[itemTitle] || 0;
        usage[itemTitle] = count + 1;

        Storage.set("usage", usage);
    }
}

function _updateArg(data) {
    if (typeof data === "object") {
        const _arg = data.arg;
        const _variables = data.variables;
        return JSON.stringify({
            alfredworkflow: {
                arg: _arg,
                variables: _variables
            }
        });
    }

    return data;
}

function _toUndefinedIfNull(x) {
    return x === null ? undefined : x;
}

/**
 * If str is json string => return object
 * If not, return str
 */
function _toObjectIfJSONString(str) {
    try {
        str = JSON.parse(str);
    } catch (err) {

    }

    return str;
}

// module export
module.exports = {
    storage: Storage,
    workflow: Workflow,
    actionHandler: ActionHandler,
    settings: Settings,
    Item: Item,
    utils: Utils,
    ICONS: ICONS,
    run: function() {
        const action = process.argv[2];
        const query = process.argv[3];
        ActionHandler.handle(action, query);
    }
};