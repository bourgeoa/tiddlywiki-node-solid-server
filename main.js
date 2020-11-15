/*\
title: $:/plugins/tiddlywiki/nodesolidserver/syncadaptor.js
type: application/javascript
module-type: syncadaptor

Saves tiddlers as ressources under containerUri on node-solid-server.
??? Migration : Replace .json tiddler by .ttl ones on firdt save. 

\*/

/* global $tw, fetch */

const NAMESPACE_KEY = '$:/plugins/bourgeoa/nodesolidserver/namespace'      // default "main"
const PRIVATENESS_KEY = '$:/plugins/bourgeoa/nodesolidserver/private'      // "yes" or "no"

// ontology
const ontology = {
	"dc":"http://purl.org/dc/elements/1.1/",
	"dcterms":"http://purl.org/dc/terms/",
	"schema":"https://schema.org/",
	"ex":"http://example.org/vocab#"  // "ex" is needed : used as default tiddlywiki ontology
}

let prefix = "";
Object.entries(ontology).forEach(
([key, value]) => {prefix = prefix+"\n@prefix "+key+": <"+value+"> ."}
)

// subject
const subject = "\n\n<this>" ;
	
// tidlerKeys to turtle predicate
const tiddlerKeys = {
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
let convertKeys = {}
Object.entries(tiddlerKeys).forEach(
	([key, value]) => {
		var pred = value.split(":")
		convertKeys[ontology[pred[0]]+pred[1]] = key
	}
)
		
class RSSyncer {
  constructor (options) {

		this.auth = require('solid-auth-client')
		const FC = require("solid-file-client"); // ./scripts/solid-file-client.bundle.js"); //
		this.rs = new FC(this.auth)
		const Widget = require("solid-file-widget");
	
		// init param
		this.wiki = options.wiki;
		this.ls = localStorage;

		this.indexFile = false;  // if true use __index__.json or create it
		this.connected = false
		this._index = null;
		this._syncedSkinny = null;

		// init widget
    let widget = new Widget(this.auth, {
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

	async getIndex () {
		if (this._index !== null) { return Promise.resolve(this._index)}
		else if (this.indexFile === true) {
			return	this.rs.readFile(this.getClient()+"/__index__.json")
			.then( body => {
				let index = JSON.parse(body) || JSON.parse('{}');
				this._index = index;
				return Promise.resolve(index)
			})
			.catch(err => {
				alert("this.getClient() "+this.getClient()+"\nbody erreur "+body);
			})
		} else {
			return this.createIndexJson(this.getClient()+"/")
			.then( index => {
				this._index = index
				return Promise.resolve(index)   // why and why not this._index
			})
		}
		
  }

  async saveIndex () {
		if (this.indexFile !== true) { return }
		if (localStorage.getItem('appRootUri') == null) {
			alert('You are not connected you cannot create tiddlers')
			window.location.reload(false)
			return
		}
		try {
			const index = await this.getIndex()
			/*await this.rs.createFile(
				this.getClient()+"/__index__json.json",
				JSON.stringify(index), 'application/json') */
			let ttlIndex = await this.createIndexJson(this.getClient()+"/")
			await this.rs.createFile(
				this.getClient()+"/__index__.json",
				JSON.stringify(ttlIndex), 'application/json')
			console.log("saved Index :"+JSON.stringify(index))
		} catch(err) {
			alert("Index not saved : " + err)
		}
	}

  getTiddlerInfo (tiddler) {
    return {}
  }

  getStatus(callback) {
		//alert('Status check initialisation parameters')
		//this.connected = false
		if (localStorage.getItem("appRootUri") == null){
			this.auth.logout()
			this.wiki.setText("$:/status/IsLoggedIn", null, null, "no");
			return callback(null,"no");
		}
		// check session
		this.auth.currentSession()
		.then( async session => {
		  if (!session) {
				this.wiki.setText("$:/status/IsLoggedIn", null, null, "no");
				return callback(null,"no");
		  } else {
				this.uri = localStorage.getItem("appRootUri")+"/"+this.getTiddlerText(NAMESPACE_KEY, "main");
				this.connected = true;
				this.sessionWebId = session.webId

				// check tiddlywiki folder
				if (!(await this.rs.itemExists(this.uri))) {
					await this.rs.createFolder(this.uri)
				}
			
				// check for migration from json to ttl
				this.rs.readFile(this.uri+"/__index__.json")
				.then( async (body) => {
					let index = JSON.parse(body) 
					let [test] = Object.keys(index) // get the first key

					// if index.json exists and a file has title.json and not title.ttl then we shall ask for migration
					if ((await this.rs.itemExists(this.uri+'/'+test +'.json')) && !(await this.rs.itemExists(this.uri+'/'+test+'.ttl'))) { // ask for convertion, if no ....
						if (confirm ("*".repeat(60)+"\n** We shall migrate the tiddlers from .json to .ttl files.\n** This will make you tiddlers RDF compliants.\n** It is only done once.\n"+"*".repeat(60))) {
							await this.migrateTiddlers(this.getClient()+"/")
						} else {
							alert("*".repeat(30)+"\n** The migration is needed\n"+"*".repeat(30))
							callback("Reload and accept migration")
							this.connected = false
							//window.location.reload(true);
						}
						/*},err => {
							if (err.slice(0,3) == "404") callback("Discrepancy between index and list of tiddlers !!!!\nIf you delete the __index__.json, we shall rebuild it at next login"+err);
							else callback(err)
						}) */
		
					}
				}, err => {})
				.then( async () => {
					// manage index
					if (!this.connected) return
					if (!confirm("Status : initialisation parameters\nDo you want to test performance \nwith an index file ???")) {
						this.indexFile = false
						this.rs.deleteFile(this.getClient()+"/__index__.json").then(success => {}, err => {})
					} else {
						this.indexFile = true
						if (!(await this.rs.itemExists(this.uri+"/__index__.json"))) {
							let newIndex = await this.createIndexJson(this.uri+"/")
							await this.rs.createFile(this.uri+"/__index__.json", JSON.stringify(newIndex), 'application/json')
						}
					}
					
					// set  status IsLoggedIn
					this.wiki.setText("$:/status/IsLoggedIn", null, null, "yes");
					callback(null,"yes",this.sessionWebId.split("/")[2].split(".")[0]);
				})
			}
		})
		.catch ( err => { alert(`Cannot access ${this.uri}\n`+err) })
  }

	getSkinnyTiddlers (callback) {
		// TODO is this still needed
		if (this.connected == false && localStorage.getItem('appRootUri') !=  null ) { this._index = null; this._syncedSkinny = null; this.connected = true}
		if (this.connected == true && localStorage.getItem('appRootUri') ==  null ) { window.location.reload(true)}

    this.getIndex().then(index => {
			if (typeof(index) == "undefined" || localStorage.getItem("appRootUri") == null) 
			{
				let tiddlers = {};
				callback(null, tiddlers);
				return true
			}
			if (this._syncedSkinny != true ) {
				//if( confirm("Do you want to test performance \nwith an index file ???")) this.indexFile = true;
				alert("You can work on different tiddlywiki's on your pod.\nOne at a time. Default 'wiki folder is 'main'.\nTo change go to 'Options', 'saving', 'nodesolidserver syncadaptor'\nBeware : Reload or disconnect after a change\n\nYou are actually linked to : "+this.getTiddlerText(NAMESPACE_KEY));
				alert("'synced with Pod'\n\n - click on + to create a tidller\n - click on <more> then <tags> to find your tiddlers\n  (including untagged ones)")
			}
			this._syncedSkinny = true;
			var tiddlers = Object.keys(index)
				.map(title => Object.assign({title}, index[title]))
			tiddlers.push({title: NAMESPACE_KEY})
			tiddlers.push({title: PRIVATENESS_KEY})
			// if (!this.readonly) tiddlers.push({title: '$:/StoryList'})

			callback(null, tiddlers)
		})
		.catch(e => {
			this._syncedSkinny = false;
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
 
		this.rs.rdf.query(this.getClient()+"/"+encodeURIComponent(title)+".ttl").then(queryRes => {
			this.jsonTiddler(queryRes)
		})
		.then( () => {
			callback(null, parseTiddlerDates(this.tiddlerJson || JSON.parse("{}")));
		})
		.catch(e => alert('L337 '+e))

		return true
  }

  async saveTiddler (tiddler, callback, tiddlerInfo) {
    if (tiddler.fields.title.slice(0, 36) === '$:/plugins/bourgeoa/nodesolidserver/' ||
	        tiddler.fields.title === '$:/StoryList') 
    {
    	this.ls.setItem(tiddler.fields.title, JSON.stringify(tiddler.fields));
    	// whenever this happens we must reload our index
    	if (tiddler.fields.title.split('/')[3] === 'nodesolidserver') { this._index = null}
    	callback(null)
    	return
    }
		if (localStorage.getItem('appRootUri') == null) {
			alert('You are not connected, you cannot create tiddlers')
			window.location.reload(false)
			return
		}
		try {
			let index = await this.getIndex()
			const tiddlerTtl = this.ttlTiddler(tiddler.fields)
			var skinny = Object.assign({}, tiddler.fields)
			delete skinny.text
			delete skinny.title
			index[tiddler.fields.title] = skinny
			await this.rs.createFile(
				this.getClient()+"/"+encodeURIComponent(tiddler.fields.title)+".ttl",
				tiddlerTtl,
				'text/turtle')
			/*await this.rs.createFile( 
				this.getClient()+"/"+encodeURIComponent(tiddler.fields.title)+".json",
				JSON.stringify(tiddler.fields), 'application/json') */
			await this.saveIndex();
			callback(null);
			return
		} catch(err) {alert("Error saved tiddler : " + err)}
    // return true
  }


  async deleteTiddler (title, callback, tiddlerInfo) {
    if (this.readonly) return callback(null);
			
    if (title.slice(0, 36) === '$:/plugins/bourgeoa/nodesolidserver/' ||
        title === '$:/StoryList') {
      this.ls.removeItem(title)
    }
    
		try {
			let index = await this.getIndex()
			delete index[title]
			await this.rs.deleteFile(this.getClient()+"/"+encodeURIComponent(title)+".ttl")
			//await this.rs.deleteFile(this.getClient()+"/"+encodeURIComponent(title)+".json")
			await this.saveIndex()
			callback(null)
			return true // is it needed TODO ???
		} catch(err) { alert("deleteTiddler : "+err) }
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
  
  //***  
  //*** build RDF .ttl files from tiddlywiki internal json format
  //***
  ttlTiddler(tiddler) {
		// list of keys and values
		let keys = Object.keys(tiddler);
		let values = Object.values(tiddler);
		let tiddlerTtl = prefix + subject;
		for (var i = 0; i < keys.length; i++){
			var sep = ' ;';
			let convertedKey = "ex:"+keys[i];
			for (var j = 0; j < Object.keys(tiddlerKeys).length; j++){
				if (keys[i] == Object.keys(tiddlerKeys)[j]) { convertedKey = Object.values(tiddlerKeys)[j]}
			}
			if (Array.isArray(values[i])) {
				var tag = "";
				for (var k = 0; k < values[i].length; k++){ 
					tag = tag+","+JSON.stringify(values[i][k]);
				}
				if (tag !== "") tiddlerTtl = tiddlerTtl +"\n   "+convertedKey+"  "+tag.substr(1)+sep  // .replace("draft.","draft_")
			}
			else tiddlerTtl = tiddlerTtl +"\n   "+convertedKey+"  "+JSON.stringify(values[i])+sep ;  // .replace("draft.","draft_")
		}
		// replace last ; by .
		tiddlerTtl = tiddlerTtl.substr(0,tiddlerTtl.length-1)+"." ;
		return tiddlerTtl
  }
  
  //***
  //*** rebuild __index__.json from .ttl folder.files
  //***
  async createIndexJson(url) {
  	return this.rs.readFolder(url).then(folder => {
  		var promises = [];
  		this.index = {};
  		if (folder.files.length == 0) {
  			promises.push(this.index)
  		} else {
				let i
					for ( i = 0; i < folder.files.length ; i ++) {
						let file = folder.files[i].name.split(".");
						if (file.pop() == "ttl") {
							var title = file.join(".")
							promises.push(
							this.rs.rdf.query(url+title+".ttl")
							.then(queryRes => {
								this.jsonTiddler(queryRes)
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
  jsonTiddler(res) {
		this.tiddlerJson = {};
		var tag = [];
			res.forEach( row => {
				// convert ontology to tiddlywiki keys
			let pred = row.predicate.value //row.predicate.uri;
				// find key for listed oncology vocab
			let key = convertKeys[pred]
				// find key for default ontology vocab
			if (key == undefined) {key = pred.split(ontology["ex"])[1]}
			let valeur = row.object
			if (key === undefined) { return callback("unknown ontology "+pred)}  // TODO callback ???
			this.tiddlerJson[key] = valeur.value
			// exception to treat multiple tags
			if (key == "tags" ) { tag.push(valeur.value); this.tiddlerJson[key] = tag};
		})
  }
  
  //***
  //*** migrate all tiddlers files tiddlywiki .json to RDF .ttl : find list
  //***
  migrateTiddlers(url) {
		return this.rs.readFile(url+"__index__.json").then(async body => {
			var promises = [];
			var nb = 0;
			var Index = Object.keys(JSON.parse(body));
			await this.rs.createFolder(url + 'migrateBackup/')
			await this.rs.createFile(url + 'migrateBackup/__index__.json', body, 'application/json')
			for (var n=0; n < Index.length ; n++) {
				const title = Index[n]
				nb += 1;
				promises.push(this.migrateTiddler(url, title))
			}
			return Promise.all(promises).then(success => {
				alert("\n"+"*".repeat(40)+"\n** success "+nb+" tiddler files\n** converted from .json to RDF .ttl\n"+"*".repeat(40))
			}, err => {alert('migrate '+err)})
		})
  }

  //***
  //*** migrate tiddler file from internal .json to RDF .ttl
  //***
  migrateTiddler(url, title) {    	
		this.rs.readFile(url+title+".json")
		.then( async body => {
			await	this.rs.createFile(url+"migrateBackup/"+title+".json", body, 'application/json')
			const tiddlerTtl = this.ttlTiddler(JSON.parse(body))
			await this.rs.createFile(url+title+".ttl", tiddlerTtl, 'text/turtle')
			await this.rs.deleteFile(url+title+".json")
		})
		.catch(err => { throw new Error('Migration of "' + title + '" failed : ' + err) })
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
