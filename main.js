/*\
title: $:/plugins/tiddlywiki/node-solid-server/syncadaptor.js
type: application/javascript
module-type: syncadaptor
Saves tiddlers as ressources under containerUri on node-solid-server.
\*/

/* global $tw, fetch */

const containerUri = '$:/plugins/bourgeoa/node-solid-server/containerUri';
let ns = containerUri.split('/').reverse();
i=0;
	if (ns[i] === "") i=1;
const docName = ns[i];

class RSSyncer {
  constructor (options) {
    this.wiki = options.wiki;
    this.ls = localStorage;

//    this.readonly = (
//      'yes' === this.getTiddlerText('$:/plugins/bourgeoa/node-solid-server/readonly')
//    )

    const fileClient = require('solid-file-client')
// Log in to the SolidPod and verify existence of the URI ressource     
	  fileClient.logout().then( ()=>{
		fileClient.popupLogin().then( webId => {
			console.log( "Logged in as ${webId}.");
			createContainerUri(containerUri);
		}, err => console.log(err) );
	  }, err => console.log(err) );

/* Initialisation du wiki concerné par ce syncadaptor ????
    let ns = this.getTiddlerText(docName) ||
    this.ls.getItem(docName) ||
        'main'
    this.ls.setItem(docName, ns)
    this.wiki.setText(docName, null, null, ns)
*/
      
  getTiddlerInfo (tiddler) {
    return {}
  }

  getStatus (callback) {
	fileClient.checkSession().then( session => {
    console.log("Logged in as "+session.webId);
    callback(null, "Logged in", session.webId)
	}, err => console.log(err) );
    callback(err)
  }

  getSkinnyTiddlers (callback) {  
    fileClient.readFolder(url).then(folder => {
		console.log("Read ${folder.name}, it has ${folder.files.length} files.");
		/* create array of filenames */
		var filename = new Array();
		for(var i=0; i < folder.files.length; i++) {
			filename[i] = folder.files[i].name.split(.json);
			filename[i].push({title: '$:/StoryList'}); // StoryList array ou file
		}
		callback(null,filename)   // est-ce un array de tiddler field objects
	}, err => console.log(err) );
	callback(err)
  } 

  loadTiddler (title, callback) {
    fileClient.readFile(title+".json").then(  body => {
    console.log("File content is : ${body}.");
    callback(null, body);
    }, err => console.log(err) );
    callback(err)
  }

  saveTiddler (tiddler, callback, tiddlerInfo) {     // ?? tiddler.fields.title
	let url = containerUri+tiddler.fields.title+".json"
	fileClient.updateFile( url, tiddler).then( success => {
    console.log( "Updated ${url}.");
	callback(null);
	}, err => console.log(err) );
	callback(err);
  }
	
  deleteTiddler (title, callback, tiddlerInfo) {
	let url = containerUri+title+".json"
    fileClient.deleteFile(url).then(success => {
	console.log("Deleted ${url}.");
	callback(null);
	}, err => console.log(err) );
	callback(err);
  }
/*
function parseTiddlerDates (fields) {
  fields.created = fields.created && new Date(Date.parse(fields.created))
  fields.modified = fields.modified && new Date(Date.parse(fields.modified))
  return fields
}
*/

function createContainerUri( uri ){
	readContainerUri(uri).then ( !success ==> {
		fileClient.createFolder( uri ).then( success => {
        console.log( "Created folder ${uri}.")
        }, err => console.log(err) ):
	}
}
        
function readContainerUri( uri ){
    fileClient.readFolder( uri ).then( folder => {
          console.log( 
            "Read ${folder.name}, it has ${folder.files.length} files."
          ), err => console.log(err) );
     }, err => console.log(err) );
}        

function logout(){
    fileClient.checkSession().then( session => {
        if(!session) console.log("Not logged in.")
        else {
            console.log("Logged in as ${session.webId}.")
            fileClient.logout().then( console.log("Logged out.") )
        }
    }, err => console.log(err) )
}

if ($tw.browser) {
  exports.adaptorClass = RSSyncer
}
