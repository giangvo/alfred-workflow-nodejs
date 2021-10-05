const _ = require('underscore');
const Chai = require('chai');

const { assert } = Chai;

const AlfredNode = require('../alfredNode');

const {
    workflow, storage, Item, utils,
} = AlfredNode;

describe('#Integration test', () => {
    const { actionHandler } = AlfredNode;

    afterEach(() => {
        actionHandler.clear();
        workflow.clearItems();
        process.argv = [];
    });

    const _getData = function() {
        return [{
            name: 'Alex',
            age: '20',
        }, {
            name: 'David',
            age: '30',
        }, {
            name: 'Kat',
            age: '10',
        }];
    };

    const search = function(query) {
        _.each(utils.filter(query, _getData(), (data) => data.name), (item) => {
            workflow.addItem(new Item({
                title: item.name,
                subtitle: item.age,
                data: item,
                hasSubItems: true,
            }));
        });

        return workflow.feedback();
    };

    it('interation test', () => {
        (function main() {
            let feedback = '';
            actionHandler.onAction('action', (query) => {
                feedback = search(query);
            });

            actionHandler.onMenuItemSelected('action', (query, selectedItemTitle) => {
                console.log('onMenuItemSelected.....');
                workflow.addItem(new Item({
                    title: `Menu Item 1: ${query}`,
                    subtitle: selectedItemTitle,
                }));

                feedback = workflow.feedback();
            });

            workflow.clearItems();
            storage.clear();

            // test no items found
            process.argv = ['', '', 'action', 'myquery'];
            AlfredNode.run();
            assert.strictEqual('{"items":[]}', feedback);
            workflow.clearItems();

            // test 1 item found
            process.argv = ['', '', 'action', 'ka'];
            AlfredNode.run();
            assert.strictEqual(`{"items":[{"valid":"NO","autocomplete":"Kat${utils.SUB_ACTION_SEPARATOR}","title":"Kat","subtitle":"10"}]}`, feedback);
            workflow.clearItems();

            // test with empty query => all items should be returned
            process.argv = ['', '', 'action', ''];
            AlfredNode.run();
            assert.strictEqual(`{"items":[{"valid":"NO","autocomplete":"Alex${utils.SUB_ACTION_SEPARATOR}","title":"Alex","subtitle":"20"},{"valid":"NO","autocomplete":"David${utils.SUB_ACTION_SEPARATOR}","title":"David","subtitle":"30"},{"valid":"NO","autocomplete":"Kat${utils.SUB_ACTION_SEPARATOR}","title":"Kat","subtitle":"10"}]}`, feedback);
            workflow.clearItems();

            // test menuitem
            process.argv = ['', '', 'action', `Alex${AlfredNode.utils.SUB_ACTION_SEPARATOR}abc`];
            AlfredNode.run();
            assert.strictEqual('{"items":[{"valid":"NO","title":"Menu Item 1: abc","subtitle":"Alex"}]}', feedback);
            workflow.clearItems();

            // test item usages are tracked
            storage.clear();
            process.argv = ['', '', 'action', `Alex${AlfredNode.utils.SUB_ACTION_SEPARATOR}`];
            AlfredNode.run();
            let usage = storage.get('usage');
            assert.strictEqual(1, usage.Alex); // usage should be tracked

            process.argv = ['', '', 'action', `Alex${AlfredNode.utils.SUB_ACTION_SEPARATOR}`];
            AlfredNode.run();
            usage = storage.get('usage');
            assert.strictEqual(2, usage.Alex); // usage should be increased

            process.argv = ['', '', 'action', `Alex${AlfredNode.utils.SUB_ACTION_SEPARATOR}abc`];
            AlfredNode.run();
            usage = storage.get('usage');
            // usage should NOT be increased when `query` is not empty
            assert.strictEqual(2, usage.Alex);
            workflow.clearItems();
            storage.clear();

            // test items are sorted
            process.argv = ['', '', 'action', ''];
            storage.set('usage', {
                Kat: 1,
                David: 2,
            });

            AlfredNode.run();
            assert.strictEqual('{"items":[{"valid":"NO","autocomplete":"David $>","title":"David","subtitle":"30"},{"valid":"NO","autocomplete":"Kat $>","title":"Kat","subtitle":"10"},{"valid":"NO","autocomplete":"Alex $>","title":"Alex","subtitle":"20"}]}', feedback);
            workflow.clearItems();
            storage.clear();
        }());
    });
});
