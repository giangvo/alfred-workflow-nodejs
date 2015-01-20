var Chai = require("chai");
var should = Chai.should();
var assert = Chai.assert;

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
    setup(function() {
        workflow.clearItems();
    });

    it("generate empty feeback", function() {
        var expectedObj =  '<?xml version="1.0" encoding="UTF-8"?><root><items/></root>';

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

suite("#StorageTest", function() {
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