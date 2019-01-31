/*\
title: $:/plugins/tiddlywiki/nodesolidserver/syncadaptor.js
type: application/javascript
module-type: syncadaptor

Saves tiddlers as ressources under containerUri on node-solid-server.

\*/

/* global $tw, fetch */

const NAMESPACE_KEY = '$:/plugins/bourgeoa/nodesolidserver/namespace'      // default "main"
const PRIVATENESS_KEY = '$:/plugins/bourgeoa/nodesolidserver/private'      // "yes" or "no"

class RSSyncer {
  constructor (options) {

// init param
    this.wiki = options.wiki;
    this.ls = localStorage;

    this.rs = require("solid-file-client");
    const Widget = require("solid-file-widget");

	this._index = null;
	this._syncedSkinny = null;

// init widget
    let widget = new Widget(this.rs, {
        leaveOpen: false,
        autoCloseAfter: 4000,
        windowReload : false,
        solidAppName : "tiddlywiki",
        appFolder : "/public/tiddlers"
        
    })

    widget.attach()

    let style = document.createElement('style')
    style.innerHTML = `#remotestorage-widget {
        position: fixed;
        top: 18px;
        right: 15px;
    }`
    document.head.appendChild(style)

// init wiki tiddlers parameters
    let ns = this.getTiddlerText(NAMESPACE_KEY) ||
      this.ls.getItem(NAMESPACE_KEY) ||
      "main";
    this.ls.setItem(NAMESPACE_KEY, ns);
    this.wiki.setText(NAMESPACE_KEY, null, null, ns);

alert("You can work on different tiddlywiki's on your pod.\nOne at a time. Default 'wiki folder is 'main'.\nTo change go to 'Options', 'saving', 'nodesolidserver syncadaptor'\nBeware : Reload or disconnect after a change\n\nYou are actually linked to : "+this.getTiddlerText(NAMESPACE_KEY));

    let priv = this.getTiddlerText(PRIVATENESS_KEY) ||
			this.ls.getItem(PRIVATENESS_KEY) ||
			"no";
    this.ls.setItem(PRIVATENESS_KEY, priv);
    this.wiki.setText(PRIVATENESS_KEY, null, null, priv);

  }
  
  getClient () {
    let ns = this.getTiddlerText(NAMESPACE_KEY, 'main');
    let priv = this.getTiddlerText(PRIVATENESS_KEY, 'no');
	if (localStorage.getItem('appRootUri') == null) { return;}
	let baseUri = localStorage.getItem('appRootUri')+"/"+ns;
	return baseUri
  }

 getIndex () {
	if (this._index !== null) { return Promise.resolve(this._index)}
	return	this.rs.readFile(this.getClient()+"/__index__.json")
				.then( body => {
					let index = JSON.parse(body) || JSON.parse('{}');
        			this._index = index;
        			return Promise.resolve(index)
    			}, err => {
    				alert("this.getClient() "+this.getClient()+"\nbody erreur "+body);
				})
  }

  saveIndex () {
	return this.getIndex().then( index => {
			this.rs.updateFile(
				this.getClient()+"/__index__.json",
				JSON.stringify(index))
				.then( success => console.log("saved Index :"+JSON.stringify(index)
    			), err => {
	    		alert("Index not saved :"+JSON.stringify(index))
	    		}
    		)
		  })
  }

  getTiddlerInfo (tiddler) {
    return {}
  }

  getStatus(callback) {
	this.checkFileSystem = true;
	this.rs.checkSession()
		.then( session => {
			if (localStorage.getItem("appRootUri") == null){
				this.rs.logout().then( success => {
//				window.location.reload(true); //firefox;
				this.connected = false;
				this.wiki.setText("$:/status/IsLoggedIn", null, null, "no");
				callback(null,"no");
				},err =>{
				this.connected = false;
				this.wiki.setText("$:/status/IsLoggedIn", null, null, "no");
				callback(null,"no");
				});
			}else{
				this.uri = localStorage.getItem("appRootUri")+"/"+this.getTiddlerText(NAMESPACE_KEY, "main");
				this.sessionWebId = session.webId;
		    	this.connected = true;

		    } 
		})
		.catch( err => {
			this.connected = false;
			this.checkFileSystem = false;
			this.wiki.setText("$:/status/IsLoggedIn", null, null, "no");
			callback(null,"no");
			})
// checkFileSystem()
		.then( () => { 
			if ( this.connected) {
				return this.rs.readFolder(this.uri).then( folder => {} //this.count = this.count +1; alert("count "+this.count)}
				, err => {
				return this.rs.createFolder(this.uri).then( folder => {}) // this.count = this.count +1; alert("count "+this.count)})
				})
			}
		})
		.then( () => { 
			if ( this.connected) {
				return this.rs.readFile(this.uri+"/__index__.json").then( body => {this.checkFileSystem = false;
				}
				, err => {
				return this.rs.createFile(this.uri+"/__index__.json", JSON.stringify({})).then( body => {this.checkFileSystem = false}) //this.count = this.count +1; alert("count "+this.count);this.checkFileSystem = false})
				})				
			}
		})
		.then( () => {
			if (this.connected && (this.checkFileSystem === false)) {
				this.wiki.setText("$:/status/IsLoggedIn", null, null, "yes");
	    		callback(null,"yes",this.sessionWebId.split("/")[2].split(".")[0]);
			}
		})
		.catch ( err => {
			if ( this.checkFileSystem === true) {
				alert("Cannot create the app filesystem :\n"+err)
			}else{
				alert("unknown error : "+err)
			}
		})


  }

  getSkinnyTiddlers (callback) {
	if (this.connected == false && localStorage.getItem('appRootUri') !=  null ) { this._index = null; this._syncedSkinny = null; this.connected = true}
	if (this.connected == true && localStorage.getItem('appRootUri') ==  null ) { window.location.reload(true)}
    this.getIndex()
      .then(index => {
		if ( typeof(index) == "undefined" || localStorage.getItem("appRootUri") == null) 
			{
			let tiddlers = {};
			callback(null, tiddlers);
			return true
			}
		if ( this._syncedSkinny != true ) { alert("'synced with Pod'\n\n - click on + to create a tidller\n - click on <more> then <tags> to find your tiddlers\n  (including untagged ones)") }
		this._syncedSkinny = true;
        var tiddlers = Object.keys(index)
          .map(title => Object.assign({title}, index[title]))
        tiddlers.push({title: NAMESPACE_KEY})
        tiddlers.push({title: PRIVATENESS_KEY})
//        if (!this.readonly) tiddlers.push({title: '$:/StoryList'})

        callback(null, tiddlers)
      })
      .catch(e => {
		this._syncedSkinny = false;
//		alert("11. e : "+e+"\this.count "+this.count);
//		window.location.reload(true);
//        callback(e)
      })
    return true
  }

  loadTiddler (title, callback) {
    if (this.readonly && title === '$:/StoryList') {
      callback(null, {title: '$:/StoryList'});
      return
    }

    if (title.slice(0, 36) === '$:/plugins/bourgeoa/nodesolidserver/' ||
        title === '$:/StoryList') {
      let tiddler = this.ls.getItem(title);
      try {
        callback(null, parseTiddlerDates(JSON.parse(tiddler)))
      } catch (e) {
        callback(null, {title, text: tiddler})
      }
      return
    }
 
    this.rs.readFile(this.getClient()+"/"+encodeURIComponent(title)+".json")
    	.then( body => { callback(null, parseTiddlerDates(JSON.parse(body) || JSON.parse("{}"))); // a confirmer
    	})
    return true
  }

  saveTiddler (tiddler, callback, tiddlerInfo) {
    if (tiddler.fields.title.slice(0, 36) === '$:/plugins/bourgeoa/nodesolidserver/' ||
	        tiddler.fields.title === '$:/StoryList') 
        {
    	this.ls.setItem(tiddler.fields.title, JSON.stringify(tiddler.fields));
    	// whenever this happens we must reload our index
    	if (tiddler.fields.title.split('/')[3] === 'nodesolidserver') { this._index = null}
    	callback(null)
    	return
    	}
	this.getIndex().then( index => {
        var skinny = Object.assign({}, tiddler.fields)
        delete skinny.text
        delete skinny.title
        index[tiddler.fields.title] = skinny
    });
	this.rs.updateFile(
	        this.getClient()+"/"+encodeURIComponent(tiddler.fields.title)+".json",
	        JSON.stringify(tiddler.fields)
	        )
        .then( success => { 
          	this.saveIndex();
			callback(null);
        	return
    	}, err => {
    		alert("Error saved tiddler : "+err);
	})
    return true
  }


  deleteTiddler (title, callback, tiddlerInfo) {
    if (this.readonly) return callback(null);
			
    if (title.slice(0, 36) === '$:/plugins/bourgeoa/nodesolidserver/' ||
        title === '$:/StoryList') {
      this.ls.removeItem(title)
    }
    
    this.getIndex().then(index => {
        delete index[title];
		this.rs.deleteFile(this.getClient()+"/"+encodeURIComponent(title)+".json").then( success => {
        	this.saveIndex();
			callback(null);
			}, err => alert("deleteTiddler : "+err))
	    })
    	return true
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
