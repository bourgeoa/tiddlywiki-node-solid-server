/*\
title: $:/plugins/tiddlywiki/nodesolidserver/syncadaptor.js
type: application/javascript
module-type: syncadaptor

<<<<<<< HEAD
Saves tiddlers as .ttl ressources under containerUri on node-solid-server.
??? Migration : Replace .json tiddler by .ttl ones on firdt save. 
=======
Saves tiddlers as ressources under containerUri on node-solid-server.
>>>>>>> 33cc34a74f13f68f7a5e04e5f08bf2952e680e1b

\*/

/* global $tw, fetch */

const NAMESPACE_KEY = '$:/plugins/bourgeoa/nodesolidserver/namespace'      // default "main"
const PRIVATENESS_KEY = '$:/plugins/bourgeoa/nodesolidserver/private'      // "yes" or "no"

class RSSyncer {
  constructor (options) {

// init param
    this.wiki = options.wiki;
    this.ls = localStorage;

<<<<<<< HEAD
    this.rs = require("solid-file-client"); // ./scripts/solid-file-client.bundle.js"); // 
    const Widget = require("solid-file-widget");
    this.jsonld = require("jsonld");
    
	this.indexFile = null;  // if true use __index__.json or create it
// if( confirm("Do you want to test performance \nwith an index file ???")) this.indexFile = true;
	this._index = null;
	this._syncedSkinny = null;
	
	// ontology
	this.ontology = {
		"dc":"http://purl.org/dc/elements/1.1/",
		"dcterms":"http://purl.org/dc/terms/",
		"schema":"https://schema.org/",
		"ex":"http://example.org/vocab#"  // "ex" is needed : used as default tiddlywiki ontology
	}
	
	this.prefix = "";
	Object.entries(this.ontology).forEach(
	 ([key, value]) => {this.prefix = this.prefix+"\n@prefix "+key+": <"+value+"> ."}
	)

	// subject
	this.subject = "\n\n<this>" ;
		
	// tidlerKeys to turtle predicate
	this.tiddlerKeys = {
		"created":"schema:dateCreated",
		"creator":"schema:creator",
		"text":"schema:text",
		"title":"dc:title",
		"type":"dc:type",
		"tags":"schema:keywords",
		"modified":"schema:dateModified",
		"modifier":"schema:contributor",
		"_canonical_uri":"schema:url",
		"draft.of":"ex:draft_of",          // dot not allowed in RDF vocab
		"draft.title":"ex:draft_title"}    // dot not allowed in RDF vocab
		
	// extended .ttl predicate to tiddlywiki tiddlerKeys .json vocab
	this.convertKeys = {}
	Object.entries(this.tiddlerKeys).forEach(
		([key, value]) => {
			var pred = value.split(":")
			this.convertKeys[this.ontology[pred[0]]+pred[1]] = key
		}
	)
	


// init widget
    let widget = new Widget(this.rs, {
        leaveOpen: false,
        autoCloseAfter: 4000,
        windowReload : false,
        solidAppName : "tiddlywiki",
        appFolder : "/public/tiddlers"
        
    })

    widget.attach()

=======
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

>>>>>>> 33cc34a74f13f68f7a5e04e5f08bf2952e680e1b
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

<<<<<<< HEAD
// alert("You can work on different tiddlywiki's on your pod.\nOne at a time. Default 'wiki folder is 'main'.\nTo change go to 'Options', 'saving', 'nodesolidserver syncadaptor'\nBeware : Reload or disconnect after a change\n\nYou are actually linked to : "+this.getTiddlerText(NAMESPACE_KEY));
=======
alert("You can work on different tiddlywiki's on your pod.\nOne at a time. Default 'wiki folder is 'main'.\nTo change go to 'Options', 'saving', 'nodesolidserver syncadaptor'\nBeware : Reload or disconnect after a change\n\nYou are actually linked to : "+this.getTiddlerText(NAMESPACE_KEY));
>>>>>>> 33cc34a74f13f68f7a5e04e5f08bf2952e680e1b

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

<<<<<<< HEAD
  getIndex () { 
	if (this._index !== null) { return Promise.resolve(this._index)}
	else if (this.indexFile === true) {
		return	this.rs.readFile(this.getClient()+"/__index__.json")
					.then( body => {
						let index = JSON.parse(body) || JSON.parse('{}');
	        			this._index = index;
	        			return Promise.resolve(index)
	    			}, err => {
	    				alert("this.getClient() "+this.getClient()+"\nbody erreur "+body);
					})
	}else{
		return this.createIndexJson(this.getClient()+"/").then( index => {
			this._index = index
//			alert("getIndex "+JSON.stringify(this._index))
			return Promise.resolve(index)   // why and why not this._index
		})
	}

  }

  saveIndex () {
  	if (this.indexFile !== true) { return}
	  return this.getIndex().then( index => {
// alert('saveIndex appRootUri ' + localStorage.getItem('appRootUri'))
		if (localStorage.getItem('appRootUri') == null) {
			alert('You are not connected you cannot create tiddlers')
			window.location.reload(false)
			return
			}
			this.rs.updateFile(
				this.getClient()+"/__index__.json",
				JSON.stringify(index), 'application/json')
=======
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
>>>>>>> 33cc34a74f13f68f7a5e04e5f08bf2952e680e1b
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
<<<<<<< HEAD
		// check session
=======
>>>>>>> 33cc34a74f13f68f7a5e04e5f08bf2952e680e1b
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
<<<<<<< HEAD
		// check tiddlywikifolder
		.then( () => { 
			if ( this.connected) {
				return this.rs.readFolder(this.uri).then( folder => {}
				, err => {
				return this.rs.createFolder(this.uri).then( success => {})
				})
			}
		})
		// check getIndex() method : __index__.json or build from tiddliwiki folder
		.then( () => { 
			if ( this.connected) {
				if (this.indexFile !== true ) {
					this.checkFileSystem = false
					this.rs.deleteFile(this.getClient()+"/__index__.json").then(success => {})
					return
				}else{
					return this.rs.readFile(this.uri+"/__index__.json").then( body => {
						this.checkFileSystem = false;
					}
					, err => {
						return this.createIndexJson(this.uri+"/").then( success => {
							return this.rs.createFile(this.uri+"/__index__.json", JSON.stringify(this.index), 'application/json').then( success => {this.checkFileSystem = false})
						})
					})
				}				
			}
		})
		// set status IsLoggedIn
=======
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
>>>>>>> 33cc34a74f13f68f7a5e04e5f08bf2952e680e1b
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
<<<<<<< HEAD
		if ( this._syncedSkinny != true ) {
      if( confirm("Do you want to test performance \nwith an index file ???")) this.indexFile = true;
      alert("You can work on different tiddlywiki's on your pod.\nOne at a time. Default 'wiki folder is 'main'.\nTo change go to 'Options', 'saving', 'nodesolidserver syncadaptor'\nBeware : Reload or disconnect after a change\n\nYou are actually linked to : "+this.getTiddlerText(NAMESPACE_KEY));
			alert("'synced with Pod'\n\n - click on + to create a tiddler\n - click on <more> then <tags> to find your tiddlers\n  (including untagged ones)")
			}
		this._syncedSkinny = true;
// alert('getSkinnyTiddlers ' + this.getClient())
=======
		if ( this._syncedSkinny != true ) { alert("'synced with Pod'\n\n - click on + to create a tidller\n - click on <more> then <tags> to find your tiddlers\n  (including untagged ones)") }
		this._syncedSkinny = true;
>>>>>>> 33cc34a74f13f68f7a5e04e5f08bf2952e680e1b
        var tiddlers = Object.keys(index)
          .map(title => Object.assign({title}, index[title]))
        tiddlers.push({title: NAMESPACE_KEY})
        tiddlers.push({title: PRIVATENESS_KEY})
//        if (!this.readonly) tiddlers.push({title: '$:/StoryList'})

        callback(null, tiddlers)
      })
      .catch(e => {
		this._syncedSkinny = false;
<<<<<<< HEAD
=======
//		alert("11. e : "+e+"\this.count "+this.count);
//		window.location.reload(true);
//        callback(e)
>>>>>>> 33cc34a74f13f68f7a5e04e5f08bf2952e680e1b
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
<<<<<<< HEAD
	  this.rs.fetchAndParse(this.getClient()+"/"+encodeURIComponent(title)+".ttl", 'text/turtle')
	    	.then(graph => {
	    		this.tiddlerJson = {};
	    		this.jsonTiddler(graph)
			}, err => {
// incomplet et à replacer dans status
				this.rs.readFile(this.getClient()+"/"+encodeURIComponent(title)+".json").then(body => {
					// we suppose error comes from the need to migrate old format .json to .ttl
					if (confirm ("*".repeat(60)+"\n** We shall migrate the tiddlers from .json to .ttl files.\n** This will make you tiddlers RDF compliants.\n** It is only done once.\n"+"*".repeat(60))) {
						return this.migrateTiddlers(this.getClient()+"/")
						}
					else {
						alert("*".repeat(30)+"\n** The migration is needed\n"+"*".repeat(30))
						callback("Reload and accept migration")
//							window.location.reload(true);
					}
				},err => {
					if (err.slice(0,3) == "404") callback("Discrepancy between index and list of tiddlers !!!!\nIf you delete the __index__.json, we shall rebuild it at next login"+err);
					else callback(err)
				})
			})
			.then( () => {
				callback(null, parseTiddlerDates(this.tiddlerJson || JSON.parse("{}")));
			})
			.catch(e => alert(e))
//	    })

/*
// read tiddler from .json file
	this.rs.readFile(this.getClient()+"/"+encodeURIComponent(title)+".json")
    	.then( body => { callback(null, parseTiddlerDates(JSON.parse(body) || JSON.parse("{}"))); // a confirmer
    	}, err => { 
    		alert("readFile "+title+" "+err)
		})
*/
=======
 
    this.rs.readFile(this.getClient()+"/"+encodeURIComponent(title)+".json")
    	.then( body => { callback(null, parseTiddlerDates(JSON.parse(body) || JSON.parse("{}"))); // a confirmer
    	})
>>>>>>> 33cc34a74f13f68f7a5e04e5f08bf2952e680e1b
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
<<<<<<< HEAD
	  this.getIndex().then( index => {
=======
	this.getIndex().then( index => {
>>>>>>> 33cc34a74f13f68f7a5e04e5f08bf2952e680e1b
        var skinny = Object.assign({}, tiddler.fields)
        delete skinny.text
        delete skinny.title
        index[tiddler.fields.title] = skinny
    });
<<<<<<< HEAD
    this.ttlTiddler(tiddler.fields)
// alert('saveTiddler ' + this.getClient())
		if (localStorage.getItem('appRootUri') == null) {
			alert('You are not connected, you cannot create tiddlers')
			window.location.reload(false)
			return
			}
    this.rs.updateFile( 
				this.getClient()+"/"+encodeURIComponent(tiddler.fields.title)+".ttl",
	    		this.tiddlerTtl, 'text/turtle')
=======
	this.rs.updateFile(
	        this.getClient()+"/"+encodeURIComponent(tiddler.fields.title)+".json",
	        JSON.stringify(tiddler.fields)
	        )
>>>>>>> 33cc34a74f13f68f7a5e04e5f08bf2952e680e1b
        .then( success => { 
          	this.saveIndex();
			callback(null);
        	return
    	}, err => {
<<<<<<< HEAD
    		alert("Error saving tiddler : "+err);
		})
	  return true
  }

=======
    		alert("Error saved tiddler : "+err);
	})
    return true
  }


>>>>>>> 33cc34a74f13f68f7a5e04e5f08bf2952e680e1b
  deleteTiddler (title, callback, tiddlerInfo) {
    if (this.readonly) return callback(null);
			
    if (title.slice(0, 36) === '$:/plugins/bourgeoa/nodesolidserver/' ||
        title === '$:/StoryList') {
      this.ls.removeItem(title)
    }
    
    this.getIndex().then(index => {
        delete index[title];
<<<<<<< HEAD
		this.rs.deleteFile(this.getClient()+"/"+encodeURIComponent(title)+".ttl").then( success => {
=======
		this.rs.deleteFile(this.getClient()+"/"+encodeURIComponent(title)+".json").then( success => {
>>>>>>> 33cc34a74f13f68f7a5e04e5f08bf2952e680e1b
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
  
  ttlPrefix() {
  	
  }

  //***  
  //*** build RDF .ttl files from tiddlywiki internal json format
  //***
  ttlTiddler(tiddler) {
	// list of keys and values
	let keys = Object.keys(tiddler);
	let values = Object.values(tiddler);
	this.tiddlerTtl = this.prefix + this.subject;
	for (var i = 0; i < keys.length; i++){
		var sep = ' ;';
		this.convertedKey = "ex:"+keys[i];
		for (var j = 0; j < Object.keys(this.tiddlerKeys).length; j++){
			if (keys[i] == Object.keys(this.tiddlerKeys)[j]) { this.convertedKey = Object.values(this.tiddlerKeys)[j]}
		}
		if (Array.isArray(values[i])) {
			var tag = "";
			for (var k = 0; k < values[i].length; k++){ 
				tag = tag+","+JSON.stringify(values[i][k]);
			}
			if (tag !== "") this.tiddlerTtl = this.tiddlerTtl +"\n   "+this.convertedKey+"  "+tag.substr(1)+sep  // .replace("draft.","draft_")
		}
		else this.tiddlerTtl = this.tiddlerTtl +"\n   "+this.convertedKey+"  "+JSON.stringify(values[i])+sep ;  // .replace("draft.","draft_")
	}
	// replace last ; by .
	this.tiddlerTtl = this.tiddlerTtl.substr(0,this.tiddlerTtl.length-1)+"." ;
  }
  
  //***
  //*** rebuild __index__.json from .ttl folder.files
  //***
  createIndexJson(url) {
  	return this.rs.readFolder(url).then(folder => {
  		var promises = [];
  		this.index = {};
  		if (folder.files.length == 0) {
  			promises.push(this.index)
  		}else{
			let i
  			for ( i = 0; i < folder.files.length ; i ++) {
  				let file = folder.files[i].name.split(".");
  				if (file.pop() == "ttl") {
  					var title = file.join(".")
  					promises.push(
  						this.rs.fetchAndParse(url+title+".ttl", 'text/turtle')
	    				.then(graph => {
	    					this.jsonTiddler(graph)
	    					delete this.tiddlerJson["text"]
							this.index[this.tiddlerJson["title"]] = this.tiddlerJson;
	    					},err => {alert("title "+err)})
	    				)
  				}
  			}
  		}
  		return Promise.all(promises).then( success => {
  			return this.index
		},err => {alert("Are some .ttl files not tiddlers ??? \n"+err)})
  	})
  }

  //***
  //*** build tiddler json from ttl graph
  //***
  jsonTiddler(graph) {
    var res = graph.match(null, null);
	this.tiddlerJson = {};
//    var j=0;
    var tag = [];
    res.forEach( row => {
    	// convert ontology to tiddlywiki keys
    	let pred = row.predicate.uri;
    	// find key for listed oncology vocab
		let key = this.convertKeys[pred]
    	// find key for default ontology vocab
		if (key == undefined) {key = pred.split(this.ontology["ex"])[1]}
    	let valeur = row.object; // subject.uri predicate.uri object
		if (key === undefined) { return callback("unknown ontology "+pred)}  //; key = pred.split("#")[1] || pred.split("/"].pop()}
		this.tiddlerJson[key] = valeur.value; // valeur.value;
		// exception to treat multiple tags
		if (key == "tags" ) { tag.push(valeur.value); this.tiddlerJson[key] = tag};
	})

  }
  
  //***
  //*** migrate all tiddlers files tiddlywiki .json to RDF .ttl : find list
  //***
  migrateTiddlers(url) {
//  	return thid.rs.readFolder(url).then( folder => {
//  		return this.backupFolder(url+"/migrateBackup").then( success => {
		return this.rs.readFile(url+"__index__.json").then(body => {
	    		var promises = [];
	    		var nb = 0;
				var Index = Object.keys(JSON.parse(body));
				for (var n=0; n < Index.length ; n++) {
					this.title = Index[n];   // encodeURI
						nb += 1;
	    				promises.push(this.migrateTiddler(url, encodeURIComponent(this.title)))
			    }
	
	    		return Promise.all(promises).then(success => {
	    			alert("\n"+"*".repeat(40)+"\n** success "+nb+" tiddler files\n** converted from .json to RDF .ttl\n"+"*".repeat(40))
	    			}, err => {alert(err)})
	    	})
  }

  //***
  //*** migrate tiddler file from internal .json to RDF .ttl
  //***
  migrateTiddler(url, title) {    	
			this.rs.readFile(url+title+".json")
			.then( body => {
				var tiddler = JSON.parse(body);
		    	this.rs.updateFile(url+"/migrateBackup/"+title+".json", tiddler, 'application/json').then(success => {
					this.ttlTiddler(tiddler)
					this.rs.updateFile(url+title+".ttl", this.tiddlerTtl, 'text/turtle').then( success => {
			    		this.rs.deleteFile(url+title+".json").then()
			    	})
		    	})
			})
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
