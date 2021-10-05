const Chai = require('chai');
const fs = require('fs');

const should = Chai.should();
const { assert } = Chai;

const AlfredNode = require('../alfredNode');

const {
    workflow, storage, Item, utils,
} = AlfredNode;

describe('#ItemTest', () => {
    it('test item 1', () => {
        const item = new Item({
            title: 'title',
        });
        const expectedObj = {
            title: 'title',
            valid: 'NO',
        };

        assert.deepEqual(item.feedback(), expectedObj);
    });

    it('test item 2', () => {
        const item = new Item({
            title: 'title',
            valid: true,
        });
        const expectedObj = {
            title: 'title',
            valid: 'YES',
        };

        assert.deepEqual(item.feedback(), expectedObj);
    });
});

describe('#WorkflowTest', () => {
    afterEach(() => {
        workflow.clearItems();
    });

    it('generate empty feeback', () => {
        const expectedObj = '{"items":[]}';

        const ret = workflow.feedback();

        assert.strictEqual(ret, expectedObj);
    });

    it('generate 1 feeback', () => {
        const expectedObj = '{"items":[{"valid":"NO","title":"title"}]}';
        const item = new Item({
            title: 'title',
        });
        workflow.addItem(item);

        const ret = workflow.feedback();

        assert.strictEqual(ret, expectedObj);

        assert.isUndefined(storage.get('wfData'), 'should not have wf data');
    });

    it('generate feeback with data', () => {
        const expectedObj = '{"items":[{"valid":"NO","title":"title a"}]}';
        const item = new Item({
            title: 'title a',
            data: {
                count: 1,
            },
        });
        workflow.addItem(item);

        const ret = workflow.feedback();

        assert.strictEqual(ret, expectedObj);

        const wfData = storage.get('wfData');
        assert.strictEqual(wfData['title a'].count, 1);
    });

    it('generate feeback with string arg', () => {
        const expectedObj = '{"items":[{"arg":"arg","valid":"NO","title":"title"}]}';
        const item = new Item({
            title: 'title',
            arg: 'arg',
        });
        workflow.addItem(item);

        const ret = workflow.feedback();

        assert.strictEqual(ret, expectedObj);

        assert.isUndefined(storage.get('wfData'), 'should not have wf data');
    });

    it('generate feeback with variables in arg', () => {
        const expectedObj = '{"items":[{"arg":"{\\"alfredworkflow\\":{\\"arg\\":\\"arg\\",\\"variables\\":{\\"key\\":\\"value\\"}}}","valid":"NO","title":"title"}]}';
        const item = new Item({
            title: 'title',
            arg: {
                arg: 'arg',
                variables: {
                    key: 'value',
                },
            },
        });
        workflow.addItem(item);

        const ret = workflow.feedback();

        assert.strictEqual(ret, expectedObj);

        const jsonObj = JSON.parse(ret);
        const arg = JSON.parse(jsonObj.items[0].arg);
        assert.strictEqual(arg.alfredworkflow.arg, 'arg');
        assert.strictEqual(arg.alfredworkflow.variables.key, 'value');

        assert.isUndefined(storage.get('wfData'), 'should not have wf data');
    });

    it('generate feeback which has sub items', () => {
        const expectedObj = `{"items":[{"valid":"NO","autocomplete":"item has subItems${utils.SUB_ACTION_SEPARATOR}","title":"item has subItems"}]}`;
        const item = new Item({
            title: 'item has subItems',
            hasSubItems: true,
        });

        workflow.addItem(item);

        const ret = workflow.feedback();

        assert.strictEqual(ret, expectedObj);

        assert.isUndefined(storage.get('wfData'), 'should not have wf data');
    });

    it('generate 2 feeback', () => {
        const expectedObj = '{"items":[{"uid":"1","valid":"YES","title":"title 1.1"},{"uid":"2","valid":"NO","title":"title 1.2"}]}';
        const item = new Item({
            title: 'title 1.1',
            valid: true,
            uid: '1',
        });
        const item2 = new Item({
            title: 'title 1.2',
            valid: false,
            uid: '2',
            data: {
                count: 1,
            },
        });
        workflow.addItem(item);
        workflow.addItem(item2);

        const ret = workflow.feedback();

        assert.strictEqual(ret, expectedObj);

        const wfData = storage.get('wfData');
        assert.strictEqual(wfData['title 1.2'].count, 1);
    });

    it('clear items', () => {
        const expectedObj = '{"items":[]}';
        const item = new Item({
            title: 'title',
        });
        workflow.addItem(item);
        workflow.clearItems();

        const ret = workflow.feedback();

        assert.strictEqual(ret, expectedObj);

        assert.isUndefined(storage.get('wfData'), 'should not have wf data');
    });

    it('generate error feeback', () => {
        const expectedObj = '{"items":[{"valid":"NO","title":"wf error","icon":{"path":"/System/Library/CoreServices/CoreTypes.bundle/Contents/Resources/AlertStopIcon.icns"}}]}';
        const ret = workflow.error('wf error');

        assert.strictEqual(ret, expectedObj);
    });

    it('generate error feeback with 1 added item', () => {
        const expectedObj = '{"items":[{"valid":"NO","title":"wf error","icon":{"path":"/System/Library/CoreServices/CoreTypes.bundle/Contents/Resources/AlertStopIcon.icns"}}]}';

        const item = new Item({
            title: 'title',
        });
        workflow.addItem(item);

        const ret = workflow.error('wf error');

        assert.strictEqual(ret, expectedObj);
    });

    it('generate warning feeback', () => {
        const expectedObj = '{"items":[{"valid":"NO","title":"wf warning","icon":{"path":"/System/Library/CoreServices/CoreTypes.bundle/Contents/Resources/AlertCautionBadgeIcon.icns"}}]}';

        const ret = workflow.warning('wf warning');

        assert.strictEqual(ret, expectedObj);
    });

    it('generate warning feeback with 1 added item', () => {
        const expectedObj = '{"items":[{"valid":"NO","title":"wf warning","icon":{"path":"/System/Library/CoreServices/CoreTypes.bundle/Contents/Resources/AlertCautionBadgeIcon.icns"}}]}';

        const item = new Item({
            title: 'title',
        });
        workflow.addItem(item);

        const ret = workflow.warning('wf warning');

        assert.strictEqual(ret, expectedObj);
    });

    it('generate info feeback', () => {
        const expectedObj = '{"items":[{"valid":"NO","title":"wf info","icon":{"path":"/System/Library/CoreServices/CoreTypes.bundle/Contents/Resources/ToolbarInfo.icns"}}]}';

        const ret = workflow.info('wf info');

        assert.strictEqual(ret, expectedObj);
    });

    it('generate info feeback with 1 added item', () => {
        const expectedObj = '{"items":[{"valid":"NO","title":"wf info","icon":{"path":"/System/Library/CoreServices/CoreTypes.bundle/Contents/Resources/ToolbarInfo.icns"}}]}';

        const item = new Item({
            title: 'title',
        });
        workflow.addItem(item);

        const ret = workflow.info('wf info');

        assert.strictEqual(ret, expectedObj);
    });
});

describe('#ActionHandlerTest', () => {
    const { actionHandler } = AlfredNode;
    afterEach(() => {
        actionHandler.clear();
    });

    it('test action handler', () => {
        let data = '';
        actionHandler.onAction('action', (query) => {
            data = query;
        });

        actionHandler.handle('action', 'myquery');

        assert.strictEqual(data, 'myquery');
    });

    it('test action handler for empty query', () => {
        let data = '';
        actionHandler.onAction('action', (query) => {
            data = query;
        });

        actionHandler.handle('action', undefined);

        assert.strictEqual(data, undefined);
    });

    it('test action handler is not call for different action', () => {
        let data = '';
        actionHandler.onAction('action', (query) => {
            data = query;
        });

        actionHandler.handle('actionX', 'myquery');

        assert.strictEqual(data, '');
    });

    it('test sub action handler', () => {
        let data1 = '';
        let data2 = '';
        let data3 = '';
        actionHandler.onMenuItemSelected('action', (query, selectedItemTitle, selectedItemData) => {
            data1 = selectedItemTitle;
            data2 = query;
            data3 = selectedItemData;
        });

        actionHandler.handle('action', `abc${utils.SUB_ACTION_SEPARATOR}myquery`);
        assert.strictEqual(data1, 'abc');
        assert.strictEqual(data2, 'myquery');
        assert.isUndefined(data3);
    });

    it('test sub action handler with empty query', () => {
        let data1 = '';
        let data2 = '';
        actionHandler.onMenuItemSelected('action', (query, selectedItem) => {
            data1 = selectedItem;
            data2 = query;
        });

        actionHandler.handle('action', `abc${utils.SUB_ACTION_SEPARATOR}`);
        assert.strictEqual(data1, 'abc');
        assert.strictEqual(data2, '');
    });

    it('test action and sub action handler', () => {
        let data0 = '';
        let data1 = '';
        let data2 = '';

        actionHandler.onAction('action', (query) => {
            data0 = query;
        });

        actionHandler.onMenuItemSelected('action', (query, selectedItem) => {
            data1 = selectedItem;
            data2 = query;
        });

        actionHandler.handle('action', 'myquery');
        assert.strictEqual(data0, 'myquery');

        actionHandler.handle('action', `abc${utils.SUB_ACTION_SEPARATOR}myquery`);
        assert.strictEqual(data1, 'abc');
        assert.strictEqual(data2, 'myquery');
    });
});

describe('#StorageTest', () => {
    afterEach(() => {
        storage.clear();
    });

    it('test set and get item without ttl', () => {
        const obj = {
            text: 'abc',
        };

        storage.set('key', obj);
        const obj2 = storage.get('key');
        obj.should.equal(obj2);
    });

    it('test set and get item with ttl is not expired', (done) => {
        const obj = {
            text: 'abc',
        };

        storage.set('key', obj, 1000); // ttl is 1s
        setTimeout(() => {
            const obj2 = storage.get('key');
            obj.should.equal(obj2);
            done();
        }, 500);
    });

    it('test set and get item with ttl is expired', (done) => {
        const obj = {
            text: 'abc',
        };

        storage.set('key', obj, 1000); // ttl is 1s
        setTimeout(() => {
            const obj2 = storage.get('key');
            should.not.exist(obj2);
            done();
        }, 1100);
    });

    it('test set and get multiple items', () => {
        const obj1 = {
            text: 'abc',
        };

        const obj2 = {
            text: 'abc',
        };

        storage.set('key1', obj1);
        storage.set('key2', obj2);

        obj1.should.equal(storage.get('key1'));
        obj2.should.equal(storage.get('key2'));
    });

    it('test remove item', () => {
        const obj = {
            text: 'abc',
        };

        storage.set('key', obj);
        storage.remove('key');

        const obj2 = storage.get('key');
        should.not.exist(obj2);
    });

    it('test clear item', () => {
        const obj = {
            text: 'abc',
        };

        storage.set('key', obj);
        storage.clear();

        const obj2 = storage.get('key');
        should.not.exist(obj2);
    });
});

describe('#Settings test', () => {
    const Settings = AlfredNode.settings;

    afterEach(() => {
        Settings.clear();
    });

    it('test set + get setting', () => {
        Settings.set('username', 'user1');

        const username = Settings.get('username');
        assert.strictEqual(username, 'user1');
    });

    it('test set + get multiple settings', () => {
        Settings.set('username', 'user1');
        Settings.set('password', 'pass1');

        assert.strictEqual('user1', Settings.get('username'));
        assert.strictEqual('pass1', Settings.get('password'));
    });

    it('test remove setting', () => {
        Settings.set('username', 'user1');
        Settings.remove('username');
        assert.isUndefined(Settings.get('username'));
    });

    it('test clear setting', () => {
        Settings.set('username', 'user1');
        Settings.clear();
        assert.isUndefined(Settings.get('username'));
    });

    /* it("test set password", function(done) {
        Settings.setPassword("user1", "mypass");
        Settings.getPassword("user1", function(error, password) {
            assert.strictEqual(password, "mypass");
            done();
        });
    }); */
});

describe('#Utils test', () => {
    it('test filter 1', () => {
        const list = [{
            key: '1',
            name: 'This is a pencil',
        }, {
            key: '2',
            name: 'This is a pen',
        }];

        const keyBuilder = function(item) {
            return item.name;
        };

        let results = utils.filter('this is', list, keyBuilder);
        assert.strictEqual(results.length, 2);
        assert.strictEqual(results[0].key, '1');

        results = utils.filter('pencil', list, keyBuilder);
        assert.strictEqual(results.length, 1);
        assert.strictEqual(results[0].key, '1');

        results = utils.filter('abcdef', list, keyBuilder);
        assert.strictEqual(results.length, 0);
    });

    it('test generate variables', () => {
        const data = {
            arg: 'xyz',
            variables: {
                key: 'value',
            },
        };

        const ret = utils.generateVars(data);
        assert.strictEqual(ret, '{"alfredworkflow":{"arg":"xyz","variables":{"key":"value"}}}');
    });

    it('test generate variables with empty variables', () => {
        const data = {
            arg: 'xyz',
        };

        const ret = utils.generateVars(data);
        assert.strictEqual(ret, '{"alfredworkflow":{"arg":"xyz"}}');
    });

    it('test generate variables with empty arg', () => {
        const data = {
            variables: {
                key: 'value',
            },
        };

        const ret = utils.generateVars(data);
        assert.strictEqual(ret, '{"alfredworkflow":{"variables":{"key":"value"}}}');
    });

    it('test generate variables with input is string (not object)', () => {
        const data = 'string arg';

        const ret = utils.generateVars(data);
        assert.strictEqual(ret, 'string arg');
    });

    it('test generate variables with input is undefined', () => {
        const data = undefined;

        const ret = utils.generateVars(data);
        assert.isUndefined(ret);
    });

    it('test get/set env', () => {
        utils.envVars.set('key', 'value');
        assert.strictEqual(utils.envVars.get('key'), 'value');
    });

    it('test get/set env for obj', () => {
        utils.envVars.set('key', {
            name: 'alex',
        });
        assert.strictEqual(utils.envVars.get('key').name, 'alex');
    });

    it('test get/set workflow var', (done) => {
        const { wfVars } = utils;
        let ret;
        wfVars.clear(() => {
            wfVars.set('key', 'value', (error) => {
                assert.isUndefined(error);

                wfVars.get('key', (err, value) => {
                    assert.isUndefined(error);
                    ret = value;
                    assert.strictEqual(ret, 'value');
                    wfVars.clear();
                    done();
                });
            });
        });
    });
});

describe('Icons tests', () => {
    const { ICONS } = AlfredNode;

    it('Check icons exist', () => {
        assert.isTrue(fs.existsSync(ICONS.ACCOUNT));
        assert.isTrue(fs.existsSync(ICONS.BURN));
        assert.isTrue(fs.existsSync(ICONS.CLOCK));
        assert.isTrue(fs.existsSync(ICONS.COLOR));
        assert.isTrue(fs.existsSync(ICONS.EJECT));
        assert.isTrue(fs.existsSync(ICONS.ERROR));
        assert.isTrue(fs.existsSync(ICONS.FAVORITE));
        assert.isTrue(fs.existsSync(ICONS.GROUP));
        assert.isTrue(fs.existsSync(ICONS.HELP));
        assert.isTrue(fs.existsSync(ICONS.HOME));
        assert.isTrue(fs.existsSync(ICONS.INFO));
        assert.isTrue(fs.existsSync(ICONS.NETWORK));
        assert.isTrue(fs.existsSync(ICONS.NOTE));
        assert.isTrue(fs.existsSync(ICONS.SETTINGS));
        assert.isTrue(fs.existsSync(ICONS.SWIRL));
        assert.isTrue(fs.existsSync(ICONS.SWITCH));
        assert.isTrue(fs.existsSync(ICONS.SYNC));
        assert.isTrue(fs.existsSync(ICONS.TRASH));
        assert.isTrue(fs.existsSync(ICONS.USER));
        assert.isTrue(fs.existsSync(ICONS.WARNING));
        assert.isTrue(fs.existsSync(ICONS.WEB));
    });
});
