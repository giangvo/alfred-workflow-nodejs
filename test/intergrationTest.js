var _ = require('underscore');
var Chai = require("chai");
var assert = Chai.assert;

var AlfredNode = require("../alfredNode.js");
var wf = AlfredNode.workflow;
var utils = AlfredNode.utils;
var Item = AlfredNode.Item;

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
            process.argv = ["", "", "action", "myquery"];

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

            AlfredNode.run();
            assert.strictEqual('<?xml version="1.0" encoding="UTF-8"?><root><items/></root>', feedback);

            process.argv = ["", "", "action", "ka"];
            AlfredNode.run();
            assert.strictEqual('<?xml version="1.0" encoding="UTF-8"?><root><items><item valid="NO" autocomplete="Kat' + utils.SUB_ACTION_SEPARATOR + '"><title>Kat</title><subtitle>10</subtitle></item></items></root>', feedback);
            wf.clearItems();

            process.argv = ["", "", "action", ""];
            AlfredNode.run();
            assert.strictEqual('<?xml version="1.0" encoding="UTF-8"?><root><items><item valid="NO" autocomplete="Alex' + utils.SUB_ACTION_SEPARATOR + '"><title>Alex</title><subtitle>20</subtitle></item><item valid="NO" autocomplete="David' + utils.SUB_ACTION_SEPARATOR + '"><title>David</title><subtitle>30</subtitle></item><item valid="NO" autocomplete="Kat' + utils.SUB_ACTION_SEPARATOR + '"><title>Kat</title><subtitle>10</subtitle></item></items></root>', feedback);
            wf.clearItems();

            // test menuitem
            process.argv = ["", "", "action", "Alex" + AlfredNode.utils.SUB_ACTION_SEPARATOR + "abc"];
            AlfredNode.run();
            assert.strictEqual('<?xml version="1.0" encoding="UTF-8"?><root><items><item valid="NO"><title>Menu Item 1: abc</title><subtitle>Alex</subtitle></item></items></root>', feedback);
            wf.clearItems();
        })();
    });
});