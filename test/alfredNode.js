var should = require("chai").should();
var AlfredNode = require("../alfredNode.js");
var storage = AlfredNode.storage;
var Item = AlfredNode.Item;

var sleep = require("sleep");

describe("#Item test", function() {
    it("test item ", function() {
        var item = new Item({});
    });
});

describe("#StorageTest", function() {
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
        sleep.usleep(1100000);  // 1.1 second

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
});