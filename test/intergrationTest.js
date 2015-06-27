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
                subtitle: item.age
            }));
        });

        return wf.feedback();
    };

    it("interation test", function() {
        (function main() {
            process.argv = ["", "", "action", "myquery"];

            var feedback = "";
            actionHandler.onAction("action", function(query) {
                feedback = search(query);
            });
            wf.clearItems();

            AlfredNode.run();
            assert.strictEqual('<?xml version="1.0" encoding="UTF-8"?><root><items/></root>', feedback);

            process.argv = ["", "", "action", "ka"];
            AlfredNode.run();
            assert.strictEqual('<?xml version="1.0" encoding="UTF-8"?><root><items><item valid="NO"><title>Kat</title><subtitle>10</subtitle></item></items></root>', feedback);
            wf.clearItems();

            process.argv = ["", "", "action", ""];
            AlfredNode.run();
            assert.strictEqual('<?xml version="1.0" encoding="UTF-8"?><root><items><item valid="NO"><title>Alex</title><subtitle>20</subtitle></item><item valid="NO"><title>David</title><subtitle>30</subtitle></item><item valid="NO"><title>Kat</title><subtitle>10</subtitle></item></items></root>', feedback);
            wf.clearItems();
        })();
    });
});