Alfred 3 Workflow Nodejs Library
=========
#### (For Alfred 2 legaxy xml workflows, use version 1.1.1)

[![Build Status](https://travis-ci.org/giangvo/alfred-workflow-nodejs.svg?branch=master)](https://travis-ci.org/giangvo/alfred-workflow-nodejs)

## Overview
A small library providing helpers to create Alfred Workflow

* Workflow & Item - Helper to build and generate feedbacks
* Storage - Helper to CRUD data
* Settings - Helper to CRUD settings, store password securely
* Utils  - Helper to filter arrays, run applesripts, etc...

## Installation

```shell
npm install "alfred-workflow-nodejs"
```
## Tests

```shell
npm test
```
## Usage
### Quick start
* Download default workflow from here: https://github.com/giangvo/alfred-workflow-nodejs/raw/master/AlfredNodejsWorkflow.alfredworkflow
* Import it to Alfred
* Navigate to workflow folder and run `npm install`
* Update module name (in package.json) and workflow name (in main.js) - Optional but recommend
* Edit main.js to add your logic.

### Workflow skeleton 
Workflow command
```shell
/usr/local/bin/node main.js "action" "query"
```
**main.js**

```js
var AlfredNode = require('alfred-workflow-nodejs');
var actionHandler = AlfredNode.actionHandler;
var workflow = AlfredNode.workflow;
var Item = AlfredNode.Item;

(function main() {
    actionHandler.onAction("action1", function(query) {
        // your code to handle action 1 here
    });
    actionHandler.onAction("action2", function(query) {
        // your code to handle action 2 here
    });
    
    actionHandler.onMenuItemSelected("action2", function(query, selectedTitle, selectedData) {
        // your code to handle manu item selected of action 2 here
    });

    AlfredNode.run();
})();
```

### Workflow and Item - Generate feedbacks 
* Workflow is used to build and generate feedbacks

```js
var workflow = AlfredNode.workflow;
// set name for workflow (you SHOULD set name for your wf)
workflow.setName("example-alfred-workflow-using-nodejs");
```

* Item is class that prepresent data of a feedback:
    * uid
    * title
    * subtitle
    * arg (support variables in arg, alfred 3)
    * icon
    * valid(true/false, default is false)
    * autocomplete
    * type
    * quicklookurl
    * text
    * mods

```js
var Item = AlfredNode.Item;
var item1 = new Item({
    title: "item 1",
    subtitle: "sub 1"
});

var item2 = new Item({
    uid: "uid",
    title: "item 1",
    subtitle: "sub 1",
    valid: true,
    icon: "icon.png",
    arg: "arg",
    autocomplete: "autocomplete"
});

var item3 = new Item({
    title: "item 3",
    subtitle: "sub 3",
    mods: {
        cmd: {
            valid: true,
            arg: "cmd arg",
            subtitle: "pressing cmd"
        },
        alt: {
            valid: false,
            arg: "alt arg",
            subtitle: "pressing alt"
        }
    }
});
workflow.addItem(item1);
workflow.addItem(item2);
// generate feedbacks
workflow.feedback();

```

* Re-run the script after a given interval (0.1 to 5 seconds)

```js
workflow.feedback({ rerun: 3 });
```

* Generate info/warning/error message

```js
workflow.info("title", "subtitle");
workflow.warning("title", "subtitle");
workflow.error("title", "subtitle");

```

### Setting variables
* Set variables via script output

```js
AlfredNode.utils.generateVars({arg: 'xyz', variables: {key: value}};
// output
'{"alfredworkflow": {"arg": "xyz", "variables": {"key": "value"}}}'
```

* Set variables via wf feedback item

```js
var Item = AlfredNode.Item;
var item = new Item({title: "item 1", arg: {arg: 'xyz', variables: {key: value}}});
workflow.addItem(item);
workflow.feedback();
// output:
{"items": [
    {
     "title": "item 1",
     "arg": "{\"alfredworkflow\": {\"arg\": \"xyz\", \"variables\": {\"key\": \"value\"}}}"
     }
]}

```

### Menu System

- Get sub items by using `TAB` key when select a feeback
- Set `hasSubItems` to true when create feeback item - require
- Set data of item to use later to build sub items by using `data` - optional
- Implement handler for menu item selected

```js
/**
* query: the query
* selectedItemTitle: title of selected item
* selectedItemData: data of selected item
**/
actionHandler.onMenuItemSelected("action", function(query, selectedItemTitle, selectedItemData){...})

```

####  Scenario:
Open Alfred and type "menu" => 2 feedbacks are generated: "Feedback A" and "Feeback B" 
=> use arrow key to navigate to "Feedback B" and press `TAB`
=> Alfred search bar will now become "Feedback A $>" and display menu items of "Feedback A": "Item 1 of Feedback A" and "Item 2 of Feedback A"

#### Code to handle "menuExample" action to generate feedback A and B

```js
actionHandler.onAction("menuExample", function(query) {
    var Item = AlfredNode.Item;
    // generate feeback A
    var item1 = new Item({
        title: "Feedback A",
        subtitle: "Press tab to get menu items",
        arg: "Feedback A",
        hasSubItems: true, // set this to true to tell that this feedback has sub Items
        valid: true,
        data: {alias: "X"} // we can set data to item to use later to build sub items
    });
    workflow.addItem(item1);

    // generate feeback B
    var item2 = new Item({
        title: "Feedback B",
        subtitle: "Press tab to get menu items",
        arg: "Feedback B",
        hasSubItems: true, // set this to true to tell that this feedback has sub Items
        valid: true,
        data: {alias: "Y"} // we can set data to item to use later to build sub items
    });
    workflow.addItem(item2);

    // generate feedbacks
    workflow.feedback();
});

```

#### Code to handle selection of "Feeback" by using `TAB`

```js
/**
* query: the query
* title: selected title
* data: data of selected item
**/
actionHandler.onMenuItemSelected("menuExample", function(query, title, data) {
    var Item = AlfredNode.Item;
    var item1 = new Item({
        title: "Item 1 of " + title,
        arg: "item 1 of " + title + " which has alias " + data.alias,
        subtitle: data.alias, // we can get data of selected item
        valid: true
    });

    var item2 = new Item({
        title: "Item 2 of " + title,
        arg: "item 2 of " + title + " which has alias " + data.alias,
        subtitle: data.alias,
        valid: true
    });

    workflow.addItem(item1);
    workflow.addItem(item2);
    // generate feedbacks
    workflow.feedback();
});

```

Download example workflow and test with keyword `menuexample` for more info

### Storage - APIs to CRUD data 
* set(key, value, [ttl])
    * key: string
    * value: string/object
    * ttl: long (milisecond) // time to live 
* get(key)
* remove(key)
* clear() : clear all data, be carefull!!!

```js
var storage = AlfredNode.storage;
storge.set("key", "value");
storage.set("key", {name: "node"}, 1000);
storage.get("key");
storage.remove("key");
storage.clear();
```
    
### Settings - APIs to CRUD settings 
Helpers to store string key/value settings, store password into Mac keychain

* set(key, value, [ttl])
    * key: string
    * value: string
* get(key)
* remove(key)
* clear() : clear all settings, be carefull!!!
* setPassword(username, password) : store password to Mac keychain (workflow name is used here as keychain service)
* getPassword(username, callback(error,password)) : get password of username from Mac keychain
    * username
    * callback(error, password): callback function that is called after password is returned

```js
var settings = AlfredNode.settings;
settings.set("key", "stringValue");
settings.get("key");
settings.remove("key");
settings.clear(); //clear all settings!!!
settings.setPassword("username", "password"); // store passwork into keychain
// get password from settings, async function
settings.getPassword("username", function(error, password){
    console.log(password);
});
```
  
### Utils - Helper functions 
Some utilities

* filter(query, list, keyBuilder) : filter list of object using fuzzy matching
    * query
    * list
    * keyBuilder : function to build key to compare from items in list
    
```js
var utils = AlfredNode.utils;
// filter array of string/object using fuzzy matching
utils.filter("a", ["a", "b", "c"], function(item){return item});
// => return ["a"]
utils.filter("pen", [{name: "pencil"}, {name: "pen"}, {name: "book"}], function(item){ return item.name});
// => return [{name: "pencil"}, {name: "pen"}]
```

* generateVars: set variables via script output (see "Setting variables" section above for usage)
* envVars: methods for enviroment variables
    * set(key, value) - value can be string or object. If value is object, it is stored as json string
    * get(key) - if stored value is object, this method will parse json string to object and return
* wfVars: methods for workflow variables
    * set(key, value, [callback]) 
        * key: variable name
        * value: need to be string **(object value is not supported)**
        * callback: callback(error) - optional
    * get(key, callback)
        * key: variable name
        * callback: callback(error, value)
    * remove(key, callback)
        * key: variable name
        * callback: callback(error) - optional
    * clear(key, callback) - **Clear all** wf variables
        * key: variable name
        * callback: callback(error) - optional

### Icons - Some built-in icons
Icons are from "/System/Library/CoreServices/CoreTypes.bundle/Contents/Resources"

```js
AlfredNode.ICONS.ERROR
AlfredNode.ICONS.INFO
```

(ACCOUNT, BURN, CLOCK, COLOR, EJECT, ERROR, FAVORITE, GROUP, HELP, HOME, INFO, NETWORK, NOTE, SETTINGS, SWIRL, SWITCH, SYNC, TRASH, USER, WARNING, WEB)

### Notes 
You can look at some tests in test folder in source code get more about usage

## Source code and document
https://github.com/giangvo/alfred-workflow-nodejs

## Release notes (Alfred 2)
* 0.x.x -> 1.x.x : for Alfred 2 workflow
* 2.0: Alfred 3 workflow
    * Return feedback as JSON
    * Support variables in 'arg' of feedback items
    * Add Utils.generateVars method to set variables
    * Add: Utils.envVars with set/get methods to set/get enviroment variables
    * Add: Utils.wfVars with set/get/remove/clear to set/get/remove/clear wf variables
* 2.0.1: Use "node-persist" version 0.0.11 (latest version of "node-persist" is not compatible with this lib)