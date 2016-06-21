var _ = require('underscore');
var Chai = require("chai");
var assert = Chai.assert;

var AlfredNode = require("../alfredNode.js");
var wf = AlfredNode.workflow;
var utils = AlfredNode.utils;
var Item = AlfredNode.Item;
var storage = AlfredNode.storage;

suite("#Integration test", function() {
    var actionHandler = AlfredNode.actionHandler;

    teardown(function() {
        actionHandler.clear();
        workflow.clearItems();
        process.argv = [];
    });

    var _getData = function() {
        return [{
            name: "Alex",
            age: "20"
        }, {
            name: "David",
            age: "30"
        }, {
            name: "Kat",
            age: "10"
        }];
    };

    var search = function(query) {
        _.each(utils.filter(query, _getData(), function(data) {
            return data.name;
        }), function(item) {
            wf.addItem(new Item({
                title: item.name,
                subtitle: item.age,
                data: item,
                hasSubItems: true
            }));
        });

        return wf.feedback();
    };

    it("interation test", function() {
        (function main() {
            var feedback = "";
            var data;
            actionHandler.onAction("action", function(query) {
                feedback = search(query);
            });

            actionHandler.onMenuItemSelected("action", function(query, selectedItemTitle, selectedItemData) {
                console.log("onMenuItemSelected.....");
                wf.addItem(new Item({
                    title: "Menu Item 1: " + query,
                    subtitle: selectedItemTitle
                }));

                feedback = wf.feedback();
                data = selectedItemData;
            });

            wf.clearItems();
            storage.clear();

            // test no items found
            process.argv = ["", "", "action", "myquery"];
            AlfredNode.run();
            assert.strictEqual('{"items":[]}', feedback);
            wf.clearItems();

            // test 1 item found
            process.argv = ["", "", "action", "ka"];
            AlfredNode.run();
            assert.strictEqual('{"items":[{"valid":"NO","autocomplete":"Kat' + utils.SUB_ACTION_SEPARATOR + '","title":"Kat","subtitle":"10"}]}', feedback);
            wf.clearItems();

            // test with empty query => all items should be returned
            process.argv = ["", "", "action", ""];
            AlfredNode.run();
            assert.strictEqual('{"items":[{"valid":"NO","autocomplete":"Alex' + utils.SUB_ACTION_SEPARATOR + '","title":"Alex","subtitle":"20"},{"valid":"NO","autocomplete":"David' + utils.SUB_ACTION_SEPARATOR + '","title":"David","subtitle":"30"},{"valid":"NO","autocomplete":"Kat' + utils.SUB_ACTION_SEPARATOR + '","title":"Kat","subtitle":"10"}]}', feedback);
            wf.clearItems();

            // test menuitem
            process.argv = ["", "", "action", "Alex" + AlfredNode.utils.SUB_ACTION_SEPARATOR + "abc"];
            AlfredNode.run();
            assert.strictEqual('{"items":[{"valid":"NO","title":"Menu Item 1: abc","subtitle":"Alex"}]}', feedback);
            wf.clearItems();

            // test item usages are tracked
            storage.clear();
            process.argv = ["", "", "action", "Alex" + AlfredNode.utils.SUB_ACTION_SEPARATOR + ""];
            AlfredNode.run();
            var usage = storage.get("usage");
            assert.strictEqual(1, usage['Alex']); // usage should be tracked

            process.argv = ["", "", "action", "Alex" + AlfredNode.utils.SUB_ACTION_SEPARATOR + ""];
            AlfredNode.run();
            var usage = storage.get("usage");
            assert.strictEqual(2, usage['Alex']); // usage should be increased

            process.argv = ["", "", "action", "Alex" + AlfredNode.utils.SUB_ACTION_SEPARATOR + "abc"];
            AlfredNode.run();
            var usage = storage.get("usage");
            assert.strictEqual(2, usage['Alex']); // usage should NOT be increased when `query` is not empty
            wf.clearItems();
            storage.clear();

            // test items are sorted
            process.argv = ["", "", "action", ""];
            storage.set("usage", {
                "Kat": 1,
                "David": 2
            });

            AlfredNode.run();
            assert.strictEqual('{"items":[{"valid":"NO","autocomplete":"David $>","title":"David","subtitle":"30"},{"valid":"NO","autocomplete":"Kat $>","title":"Kat","subtitle":"10"},{"valid":"NO","autocomplete":"Alex $>","title":"Alex","subtitle":"20"}]}', feedback);
            wf.clearItems();
            storage.clear();
        })();
    });
});