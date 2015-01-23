Alfred Workflow Nodejs Library
=========

A small library providing helpers to create Alfred Workflow
## Installation ##

```
#!bash
npm install "https://bitbucket.org/giangvo_Atlassian/alfred-workflow-nodejs/get/master.tar.gz"
```
## Tests ##

```
#!bash
npm test
```
## Usage ##
### Import AlfredNode instance ###
```
#!javascript
var AlfredNode = require('alfred-workflow-nodejs');
```

### Workflow and Item - Generate feedbacks ###
* Workflow is used to build and generate list of feedbacks

```
#!javascript
var workflow = AlfredNode.workflow;
// set name for workflow (you SHOULD set name for your wf)
workflow.setName("example-alfred-workflow-using-nodejs");
```

* Item is class that prepresent data of a feedback:
    * uid
    * title
    * subtitle
    * arg
    * icon
    * valid(true/false, default is false)
    * autocomplete

```
#!javascript
var Item = AlfredNode.Item;
var item1 = new Item({title: "item 1", subtile: "sub 1"});
var item2 = new Item({uid: "uid", title: "item 1", subtile: "sub 1", valid: true, icon: "icon.png", arg: "arg",  autocomplete: "autocomplete"});
workflow.addItem(item1);
workflow.addItem(item2);
// generate feedbacks
workflow.feedback();

```

### Storage - APIs to CRUD data ###
* set(key, value, [ttl])
    * key: string
    * value: object
    * ttl: long (milisecond)
* get(key)
* remove(key)
* clear() : clear all data, be carefull!!!
```
#!javascript
var storage = AlfredNode.storage;
storge.set("key", "value");
storage.set("key", {"name":"node", 1000}; //ttl in miliseconds
storage.get("key");
storage.remove("key");
storage.clear();
```
    
### Settings - APIs to CRUD settings ###
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
```
#!javascript
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
  
### Utils - Helper functions###
Some utilities

* filter(query, list, keyBuilder) : filter list of object using fuzzy matching
    * query
    * list
    * keyBuilder : function to build key to compare from items in list
```
#!javascript
var utils = AlfredNode.utils;
// filter array of string/object using fuzzy matching
utils.filter("a", ["a", "b", "c"], function(item){return item});
// => return ["a"]
utils.filter("pen", [{name: "pencil"}, {name: "pen"}, {name: "book"}], function(item){ return item.name});
// => return [{name: "pencil"}, {name: "pen"}]

```

## Release History ##
* 1.0 Initial release