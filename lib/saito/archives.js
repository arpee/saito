const saito = require('../saito');


function Archives(app) {

  if (!(this instanceof Archives)) {
    return new Archives(app, archivesjson);
  }

  this.app                 = app || {};
  this.archives            = []; // {"host":"localhost","port":12101,"publickey":"", "active":"inactive", "type":"messages"}
  this.messages            = [];
  this.local_storage_limit = 40;

  return this;

}
module.exports = Archives;


//
// TODO
//
// we are identifying transactions by ID where we should
// be using the sig or some other unique identifier that 
// will not change depending on the chain we are on.
//


////////////////
// initialize //
////////////////
//
// connects to any archives that are contained in our
// options file.
//
Archives.prototype.initialize = function initialize() {

  if (this.app.options.archives != null) {
    for (let i = 0; i < this.app.options.archives.length; i++) {
      this.archives[i] = this.app.options.archives[i];
    }
  }

  // add any archives to our peer list and connect as needed
  for (let vcm = 0; vcm < this.archives.length; vcm++) {
    // do not send blocks, transactions or tickets to any archive servers by default
    this.app.network.addPeer(this.archives[vcm].host, this.archives[vcm].port, 0, 0, 0);
  }

  //
  // load messages locally
  //
  if (this.app.BROWSER == 1) {
    if (typeof(Storage) !== "undefined") {
      let data = localStorage.getItem("messages");
      this.messages = JSON.parse(data);
      if (this.messages == null) { this.messages = []; } 
    }
  }

  //
  // load data remotely
  //
  for (let s = 0; s < this.archives.length; s++) {
    for (let t = 0; t < this.app.network.peers.length; t++) {
      if (this.archives[s].host == this.app.network.peers[t].peer.host && this.archives[s].active == "active") {

        // send request for archived messages
        let userMessage = {};
            userMessage.request          = "archive load request";
            userMessage.data             = {};
            userMessage.data.number      = 50;
            userMessage.data.starting_at = 0;
            userMessage.data.publickey   = this.app.wallet.returnPublicKey();

        this.app.network.peers[t].sendRequest(userMessage.request, userMessage.data);
  
      }
    }
  }
}


/////////////////////
// containsMessage //
/////////////////////
//
// finds out if we have a message in our archives
//
// @params {integer} transaction_id of message
//
Archives.prototype.containsMessage = function containsMessage(tx_id) {
  for (let amt = this.messages.length-1; amt >= 0; amt--) {
    if (this.messages[amt].transaction.id == tx_id) { return 1; }
  }
  return 0;
}


/////////////////////
// processMessages //
/////////////////////
//
// This is how we interact with modules, they ask us to give them a 
// certain number of messages, and we comply, submitting the messages
// to them as part of a callback function.
//
// @params {integer} number of messages to load
// @params {callback}
//
Archives.prototype.processMessages = function processMessages(number, callback) {
  var tmpmsg = [];
  var err    = {};
  let starting_point = this.messages.length - number;  
  if (starting_point < 0) { starting_point = 0; }
  for (let n = starting_point; n < this.messages.length; n++) {
    tmpmsg[n] = this.messages[n];
  }
  callback(err, tmpmsg);
}


////////////////////////////
// returnTransactionById //
///////////////////////////
//
// given a transaction Id, returns the transaction if
// it exists in our archive.
//
// @params {integer} transaction id
//
Archives.prototype.returnTransactionById = function returnTransactionById(txid) {
  for (let mv = this.messages.length-1; mv >= 0; mv--) {
    if (this.messages[mv].transaction.id == txid) { return this.messages[mv]; }
  }
  return null;
}


///////////////////
// removeMessage //
///////////////////
Archives.prototype.removeMessage = function removeMessage(txid) {

  let mytxid = txid;
  let mytxts = 0;


  ////////////////////
  // delete locally //
  ////////////////////
  for (let n = this.messages.length-1; n >= 0; n--) {
    if (this.messages[n].transaction.id == txid) {
      mytxts = this.messages[n].transaction.ts;
      this.messages.splice(n,1);
      n = this.messages.length;
      this.saveArchives();
    }
  }

  /////////////////////
  // delete remotely //
  /////////////////////
  for (let aas = 0; aas < this.archives.length; aas++) {
    if (this.archives[aas].active == "active") {
      
      var message                = {};
          message.request        = "archive delete request";
          message.data           = {};
          message.data.publickey = this.app.wallet.returnPublicKey();
          message.data.txid      = mytxid;
          message.data.txts      = mytxts;
          message.data.auth      = this.app.crypt.signMessage("delete_"+mytxid, this.app.wallet.returnPrivateKey());
          message.data.unixtime  = tx.transaction.ts;

      for (let y = 0; y < this.app.network.peers.length; y++) {
        if (this.app.network.peers[y].peer.publickey = this.archives[aas].publickey) {
	  this.app.network.peers[y].sendRequest(message.request, message.data);
        }
      }
    }
  }
}


///////////////////
// resetArchives //
///////////////////
//
// delete all content locally and remotely
//
Archives.prototype.resetArchives = function resetArchives() {

  this.messages = [];

  if (this.app.BROWSER == 1) {
    if (typeof(Storage) !== "undefined") {
      localStorage.setItem("messages", JSON.stringify(this.messages));
    }
  }

  var message                = {};
      message.request        = "archive reset request";
      message.data           = {};
      message.data.publickey = this.app.wallet.returnPublicKey();
      message.data.unixtime  = new Date().getTime();
      message.data.auth      = this.app.crypt.signMessage("reset_"+message.data.unixtime, this.app.wallet.returnPrivateKey());

  for (let aas = 0; aas < this.archives.length; aas++) {
    if (this.archives[aas].active == "active") {
      for (let y = 0; y < this.app.network.peers.length; y++) {
        if (this.app.network.peers[y].peer.publickey = this.archives[aas].publickey) {
          this.app.network.peers[y].sendRequest(message.request, message.data);
        }
      }
    }
  }
}


//////////////////
// saveArchives //
//////////////////
Archives.prototype.saveArchives = function saveArchives() {
  if (this.app.BROWSER == 1) {
    if (typeof(Storage) !== "undefined") {
      localStorage.setItem("messages", JSON.stringify(this.messages));
    }
  }
  this.app.options.archives = JSON.stringify(this.archives);;
  this.app.storage.saveOptions();
}


/////////////////////
// saveTransaction //
/////////////////////
//
// save a transaction
//
// @params {saito.transaction} tx to save
//
Archives.prototype.saveTransaction = function saveTransaction(tx) {

  ///////////////////
  // Local Storage //
  ///////////////////
  if (this.app.BROWSER == 1) {
    if (typeof(Storage) !== "undefined") {

      // reload before saving
      let data = localStorage.getItem("messages");

      this.messages = JSON.parse(data);
      if (this.messages == null) {
	console.log("resetting Message array in Archives saveTransaction");
	this.messages = [];
      }

      // do not add duplicates
      for (let mb = 0; mb < this.messages.length; mb++) {
	if (this.messages[mb].transaction.msig === tx.transaction.msig) { 
	  return; 
	}
      }
       
      // if we are at our local storage limit remove the
      // last email and add our new one to the top
      if (this.messages.length == this.local_storage_limit) {
        for (let mb = 0; mb < this.messages.length-1; mb++) {
	  this.messages[mb] = this.messages[mb+1];
        }
	this.messages[this.messages.length-1] = tx;
      } else {
        this.messages.push(tx);
      }
      localStorage.setItem("messages", JSON.stringify(this.messages));
    }
  }


  /////////////////////
  // backup services //
  /////////////////////
  for (let aas = 0; aas < this.archives.length; aas++) {
    if (this.archives[aas].active == "active") {
      
      var message                 = {};
          message.request         = "archive";
          message.data            = {};
          message.data.publickey  = this.app.wallet.returnPublicKey();
          message.data.tx         = JSON.stringify(tx.transaction);
          message.data.block_id   = "";
          message.data.unixtime   = tx.transaction.ts;

      for (let y = 0; y < this.app.network.peers.length; y++) {
        if (this.app.network.peers[y].peer.publickey = this.archives[aas].publickey) {
	  this.app.network.peers[y].sendRequest(message.request, message.data);
        }
      }
    }
  }
}

