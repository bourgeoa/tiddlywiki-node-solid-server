/*\
title: $:/plugins/tiddlywiki/node-solid-server/syncadaptor.js
type: application/javascript
module-type: syncadaptor
Saves tiddlers as ressources under containerUri on node-solid-server.
\*/

/* global $tw, fetch */

const NAMESPACE_KEY = '$:/plugins/fiatjaf/remoteStorage/namespace'      // default "main"
const PRIVATENESS_KEY = '$:/plugins/fiatjaf/remoteStorage/private'      // "yes" or "no"
const PODROOT_KEY = '$:/plugins/bourgeoa/node-solid-server/containeruri'; // "https://<podname>"
const LOGGEDIN_KEY = '$:/plugins/bourgeoa/node-solid-server/loggedin';  // "yes-yes" or "yes-no" or "no-no" or "no-yes"

/* 
let baseuri = 
let ns = containerUri.split('/').reverse();
i=0;
	if (ns[i] === "") i=1;
const docName = ns[i];
*/

class RSSyncer {
  constructor (options) {
    this.wiki = options.wiki
    this.readonly = (
      'yes' === this.getTiddlerText('$:/plugins/bourgeoa/node-solid-server/readonly')
    )
    this.ls = localStorage;

    const fileClient = require('solid-file-client');

		// init wiki tiddlers parameters
    let ns = this.getTiddlerText(NAMESPACE_KEY) ||
      this.ls.getItem(NAMESPACE_KEY) ||
      'main';
    this.ls.setItem(NAMESPACE_KEY, ns);
    this.wiki.setText(NAMESPACE_KEY, null, null, ns);

    let priv = this.getTiddlerText(PRIVATENESS_KEY) ||
			this.ls.getItem(PRIVATENESS_KEY) ||
			'no';
    this.ls.setItem(PRIVATENESS_KEY, priv);
    this.wiki.setText(PRIVATENESS_KEY, null, null, priv);

    let pr = this.getTiddlerText(PODROOT_KEY) ||
      this.ls.getItem(PODROOT_KEY) ||
      "https://solid.community";           // error because pod provider
    this.ls.setItem(PODROOT_KEY, pr);
    this.wiki.setText(PODROOT_KEY, null, null, pr);

    let loggedin = this.getTiddlerText(LOGGEDIN_KEY) ||
      this.ls.getItem(LOGGEDIN_KEY) ||
        'no-yes'
    this.ls.setItem(LOGGEDIN_KEY, loggedin);
    this.wiki.setText(LOGGEDIN_KEY, null, null, loggedin);

    // Log in/logout to the SolidPod and verify existence of the URI ressource     
    if (LOGGEDIN_KEY === "yes-no") {
      fileClient.logout().then( ()=>{
      	console.log( "Logged out");
      	this.ls.setItem(LOGGEDIN_KEY, "no-yes");
      	this.wiki.setText(LOGGEDIN_KEY, null, null, "no-yes");
      });
    }
    else if (LOGGEDIN_KEY === "no-yes") {
      fileClient.logout().then( ()=>{
	fileClient.popupLogin("https://solid.community").then( webId => {
	  console.log( "Logged in as ${webId}.");
	  this.ls.setItem(LOGGEDIN_KEY, "yes-no");
	  this.wiki.setText(LOGGEDIN_KEY, null, null, "yes-no");
	  getClient();
	}, err => console.log(err) );
      }, err => console.log(err) );
    }
  }
  getClient () {
    let ns = this.getTiddlerText(NAMESPACE_KEY, 'main');
    let priv = this.getTiddlerText(PRIVATENESS_KEY, 'no');
    let client = this.getTiddlerText(PODROOT_KEY_KEY, "https://bourgeoa.solid.community")+"/${priv !== 'yes' ? 'public/' : 'private'}tiddlers/${ns}/";
		let baseuri = client;    // check existence, else create, return uri or err
		return baseuri;
  }

  getTiddlerInfo (tiddler) {
    return {}
  }

  getStatus (callback) {//    callback(null, this.rs.remote.connected, this.rs.remote.userAddress)
		fileClient.checkSession().then( session => {
			console.log("Logged in as "+session.webId);
			callback(null, session, session.webId)   // to be updated with webid user name
		}, err => console.log(err) );
    callback(err)
  }

	getSkinnyTiddlers (callback) {
		let url = getClient();
    fileClient.readFolder(url).then(folder => {
			console.log("Read ${folder.name}, it has ${folder.files.length} files.");
			/* create array of tiddlers */
			var tiddlers = new Array();
			for(var i=0; i < folder.files.length; i++) {
				tiddlers[i] = folder.files[i].name.split(".json");
			}
			tiddlers.push({title: NAMESPACE_KEY});
			tiddlers.push({title: PRIVATENESS_KEY});
			tiddlers.push({title: PODROOT_KEY});
			tiddlers.push({title: LOGGEDIN_KEY});
			
			if (!this.readonly) tiddlers.push({title: '$:/StoryList'});
			callback(null,tiddlers);   // est-ce un array de tiddler field objects
		}, err => console.log(err) );
		callback(err)
  } 

  loadTiddler (title, callback) {
    if (this.readonly && title === '$:/StoryList') {
      callback(null, {title: '$:/StoryList'});
      return
    }

    if (title.slice(0, 37) === '$:/plugins/bourgeoa/node-solid-server/' ||
        title === '$:/StoryList') {
      let tiddler = this.ls.getItem(title);

      try {
        callback(null, parseTiddlerDates(JSON.parse(tiddler)))
      } catch (e) {
        callback(null, {title, text: tiddler})
      }

      return
    }

    let url = getClient()+encodeURIComponent(title)+".json";
    fileClient.readFile(url).then(  body => {
    console.log("File content is : ${body}.");
    callback(null, body);
    }, err => console.log(err) );
  callback(err)
  }

  saveTiddler (tiddler, callback, tiddlerInfo) {
    if (this.readonly) return callback(null);

    if (tiddler.fields.title.slice(0, 37) === '$:/plugins/bourgeoa/node-solid-server/' ||
      tiddler.fields.title === '$:/StoryList') {
	this.ls.setItem(tiddler.fields.title, JSON.stringify(tiddler.fields));
	callback(null);
	return
      }
      let url = getClient()+encodeURIComponent(tiddler.fields.title)+".json";
	fileClient.updateFile( url, tiddler,"application/json").then( success => {
		console.log( "Updated ${url}.");
		callback(null);
		}, err => console.log(err) );
	callback(err);
  }
	
  deleteTiddler (title, callback, tiddlerInfo) {
    if (this.readonly) return callback(null);
			
    if (title.slice(0, 37) === '$:/plugins/bourgeoa/node-solid-server/' ||
        title === '$:/StoryList') {
      this.ls.removeItem(title)
    }
    let url = getClient()+encodeURIComponent(title)+".json";
    fileClient.deleteFile(url).then(success => {
	console.log("Deleted ${url}.");
	callback(null);
	}, err => console.log(err) );
     callback(err);
  }

  getTiddlerText (title, deft) {
    let tiddler = this.wiki.getTiddlerText(title);
    var text;
    try {
      text = JSON.parse(tiddler).text
    } catch (e) {
      text = tiddler
    }
    return text || deft
  }
}

function parseTiddlerDates (fields) {
  fields.created = fields.created && new Date(Date.parse(fields.created));
  fields.modified = fields.modified && new Date(Date.parse(fields.modified));
  return fields
}

if ($tw.browser) {
  exports.adaptorClass = RSSyncer
}
