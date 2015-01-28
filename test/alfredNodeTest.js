var Chai = require("chai");
var should = Chai.should();
var assert = Chai.assert;
var sinon = require("sinon");

var sleep = require("sleep");

var AlfredNode = require("../alfredNode.js");
var workflow = AlfredNode.workflow;
var storage = AlfredNode.storage;
var Item = AlfredNode.Item;

suite("#ItemTest", function() {
    it("test item 1", function() {
        var item = new Item({
            "title": "title"
        });
        var expectedObj = {
            "item": {
                "title": "title",
                "@valid": "NO"
            }
        };

        assert.deepEqual(item.feedback(), expectedObj);
    });

    it("test item 2", function() {
        var item = new Item({
            "title": "title",
            "valid": true
        });
        var expectedObj = {
            "item": {
                "title": "title",
                "@valid": "YES"
            }
        };

        assert.deepEqual(item.feedback(), expectedObj);
    });
});

suite("#WorkflowTest", function() {
    teardown(function() {
        workflow.clearItems();
    });

    it("generate empty feeback", function() {
        var expectedObj = '<?xml version="1.0" encoding="UTF-8"?><root><items/></root>';

        var ret = workflow.feedback();

        assert.strictEqual(expectedObj, ret);

    });

    it("generate 1 feeback", function() {
        var expectedObj = '<?xml version="1.0" encoding="UTF-8"?><root><items><item valid="NO"><title>title</title></item></items></root>';
        var item = new Item({
            "title": "title"
        });
        workflow.addItem(item);

        var ret = workflow.feedback();

        assert.strictEqual(expectedObj, ret);

    });

    it("generate 2 feeback", function() {
        var expectedObj = '<?xml version="1.0" encoding="UTF-8"?><root><items><item valid="NO"><title>title</title></item><item uid="1" valid="YES"><title>title 1</title></item><item uid="2" valid="NO"><title>title 2</title></item></items></root>';
        var item = new Item({
            "title": "title 1",
            "valid": true,
            "uid": "1"
        });
        var item2 = new Item({
            "title": "title 2",
            "valid": false,
            "uid": "2"
        });
        workflow.addItem(item);
        workflow.addItem(item2);

        var ret = workflow.feedback();

        assert.strictEqual(expectedObj, ret);
    });
});

suite("#ActionHandlerTest", function() {
    var actionHandler = AlfredNode.actionHandler;
    teardown(function() {
        actionHandler.clear();
    });


    it("test action handler", function() {
        var data = "";
        actionHandler.onAction("action", function(query) {
            data = query;
        });

        actionHandler.handle("action", "myquery");

        assert.strictEqual(data, "myquery");

    });

    it("test action handler is not call for different action", function() {
        var data = "";
        actionHandler.onAction("action", function(query) {
            data = query;
        });

        actionHandler.handle("actionX", "myquery");

        assert.strictEqual(data, "");

    });

    it("test sub action handler", function() {
        var data1 = "";
        var data2 = "";
        actionHandler.onSubAction("action", function(selectedItem, query) {
            data1 = selectedItem;
            data2 = query;
        });

        actionHandler.handle("action", "abc>myquery");
        assert.strictEqual(data1, "abc");
        assert.strictEqual(data2, "myquery");
    });

    it("test sub action handler with empty query", function() {
        var data1 = "";
        var data2 = "";
        actionHandler.onSubAction("action", function(selectedItem, query) {
            data1 = selectedItem;
            data2 = query;
        });

        actionHandler.handle("action", "abc>");
        assert.strictEqual(data1, "abc");
        assert.strictEqual(data2, "");
    });

    it("test action and sub action handler", function() {
        var data0 = "";
        var data1 = "";
        var data2 = "";

        actionHandler.onAction("action", function(query) {
            data0 = query;
        });

        actionHandler.onSubAction("action", function(selectedItem, query) {
            data1 = selectedItem;
            data2 = query;
        });

        actionHandler.handle("action", "myquery");
        assert.strictEqual(data0, "myquery");

        actionHandler.handle("action", "abc>myquery");
        assert.strictEqual(data1, "abc");
        assert.strictEqual(data2, "myquery");
    });
});

suite("#StorageTest", function() {
    teardown(function() {
        storage.clear();
    });

    it("test set and get item without ttl", function() {
        var obj = {
            text: "abc"
        };

        storage.set("key", obj);
        var obj2 = storage.get("key");
        obj.should.equal(obj2);
    });

    it("test set and get item with ttl is not expired", function() {
        var obj = {
            text: "abc"
        };

        storage.set("key", obj, 1000); // ttl is 1s
        sleep.usleep(500000); // 0.5 s

        var obj2 = storage.get("key");
        obj.should.equal(obj2);

    });

    it("test set and get item with ttl is expired", function() {
        var obj = {
            text: "abc"
        };

        storage.set("key", obj, 1000); // ttl is 1s
        sleep.usleep(1100000); // 1.1 second

        var obj2 = storage.get("key");
        should.not.exist(obj2);
    });

    it("test set and get multiple items", function() {
        var obj1 = {
            text: "abc"
        };

        var obj2 = {
            text: "abc"
        };

        storage.set("key1", obj1);
        storage.set("key2", obj2);

        obj1.should.equal(storage.get("key1"));
        obj2.should.equal(storage.get("key2"));
    });

    it("test remove item", function() {
        var obj = {
            text: "abc"
        };

        storage.set("key", obj);
        storage.remove("key");

        var obj2 = storage.get("key");
        should.not.exist(obj2);
    });

    it("test clear item", function() {
        var obj = {
            text: "abc"
        };

        storage.set("key", obj);
        storage.clear();

        var obj2 = storage.get("key");
        should.not.exist(obj2);
    });
});


suite("#Settings test", function() {
    var Settings = AlfredNode.settings;

    teardown(function() {
        Settings.clear();
    });

    it("test set + get setting", function() {
        Settings.set("username", "user1");

        var username = Settings.get("username");
        assert.strictEqual(username, "user1");
    });

    it("test set + get multiple settings", function() {
        Settings.set("username", "user1");
        Settings.set("password", "pass1");

        assert.strictEqual("user1", Settings.get("username"));
        assert.strictEqual("pass1", Settings.get("password"));
    });

    it("test remove setting", function() {
        Settings.set("username", "user1");
        Settings.remove("username");
        assert.isUndefined(Settings.get("username"));
    });

    it("test clear setting", function() {
        Settings.set("username", "user1");
        Settings.clear();
        assert.isUndefined(Settings.get("username"));
    });

    it("test set password", function(done) {
        Settings.setPassword("user1", "mypass");
        Settings.getPassword("user1", function(error, password) {
            assert.strictEqual(password, "mypass");
            done();
        });
    });
});

suite("#Utils test", function() {
    var Utils = AlfredNode.utils;
    it("test filter 1", function() {
        var list = [{
            key: "1",
            name: "This is a pencil"
        }, {
            key: "2",
            name: "This is a pen"
        }];

        var keyBuilder = function(item) {
            return item.name;
        };

        var results = Utils.filter("this is", list, keyBuilder);
        assert.strictEqual(results.length, 2);
        assert.strictEqual(results[0].key, "1");

        results = Utils.filter("pencil", list, keyBuilder);
        assert.strictEqual(results.length, 1);
        assert.strictEqual(results[0].key, "1");

        results = Utils.filter("abcdef", list, keyBuilder);
        assert.strictEqual(results.length, 0);
    });
});

suite("#RunTest", function() {
    var actionHandler = AlfredNode.actionHandler;

    teardown(function() {
        actionHandler.clear();
        process.argv = [];
    });

    it("test 1", function() {
        process.argv = ["", "", "action", "myquery"];

        var data = "";
        actionHandler.onAction("action", function(query) {
            data = query;
        });

        AlfredNode.run();

        assert.strictEqual(data, "myquery");
    });
});