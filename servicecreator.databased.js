function createServiceMixin (execlib) {
  'use strict';

  var execSuite = execlib.execSuite,
    dataSuite = execlib.dataSuite,
    taskRegistry = execSuite.taskRegistry,
    lib = execlib.lib,
    qlib = lib.qlib;

  function ChatStore (chathotel) {
    lib.Destroyable.call(this);
    this.chathotel = chathotel;
    this.inited = false;
    chathotel.destroyed.attachForSingleShot(this.destroy.bind(this));
  }
  lib.inherit(ChatStore, lib.Destroyable);
  ChatStore.prototype.__cleanUp = function () {
    this.inited = null;
    this.chathotel = null;
  };
  ChatStore.prototype.beginInit = lib.dummyFunc;
  ChatStore.prototype.endInit = function () {
    this.inited = true;
  };
  ChatStore.prototype.update = lib.dummyFunc;
  ChatStore.prototype.delete = lib.dummyFunc;
  ChatStore.prototype.create = function (chatm) {
    if (!this.chathotel) {
      return;
    }
    if (!this.inited) {
      //return;
    }
    if (!(chatm && !chatm.seen)) {
      return; //ignore even new records that are somehow initially seen
    }
    this.chathotel.onNewChatMessage(chatm);
  };

  function ChatHotelServiceMixin (prophash) {
    if (!lib.isFunction(this.findRemote)) {
      throw new lib.Error('REMOTESERVICELISTENERSERVICEMIXIN_NOT_IMPLEMENTED', 'Your class does not implement the RemoteServiceListenerServiceMixin');
    }
    this.decoder = new dataSuite.DataDecoder(new ChatStore(this));
    this.findRemote(prophash.pathtochatdb || 'Chat', null, 'Chat');
    this.state.data.listenFor('Chat', this.onChatSink.bind(this), true);
  }
  ChatHotelServiceMixin.prototype.destroy = function () {
    if (this.decoder) {
      this.decoder.destroy();
    }
    this.decoder = null;
  };
  ChatHotelServiceMixin.prototype.findUnreadChatForUser = execSuite.dependentServiceMethod([], ['Chat'], function (chatsink, username, defer) {
    taskRegistry.run('readFromDataSink', {
      sink: chatsink,
      filter: {
        op: 'and',
        filters: [{
          op: 'eq',
          field: 'to',
          value: username
        },{
          op: 'notexists',
          field: 'seen'
        }]
      },
      cb: defer.resolve.bind(defer),
      errorcb: defer.reject.bind(defer)
    });
  });
  ChatHotelServiceMixin.prototype.sendChatMessage = execSuite.dependentServiceMethod([], ['Chat'], function (chatsink, messageobj, defer) {
    var sendobj;
    if (!messageobj) {
      defer.reject(new lib.Error('NO_CHAT_MESSAGE_OBJ', 'You must specify the message object'));
    }
    if (!(messageobj.to && messageobj.to.name)) {
      defer.reject(new lib.Error('NO_CHAT_RECIPIENT', 'Your message object must have at least the "to" object with the "name" property'));
      return;
    }
    if (!(messageobj.from && messageobj.from.name)) {
      defer.reject(new lib.Error('NO_CHAT_SENDER', 'Your message object must have at least the "from" object with the "name" property'));
      return;
    }
    sendobj = {
      from: messageobj.from.name,
      from_role: messageobj.from.role,
      from_realm: messageobj.from ? messageobj.from.realm : null,
      to: messageobj.to.name,
      to_role: messageobj.to.role,
      to_realm: messageobj.to.realm,
      message: messageobj.message
    };
    if (!lib.isString(sendobj.message) && sendobj.message.length) {
      defer.resolve(sendobj);
      return;
    }
    qlib.promise2defer(chatsink.call('create', sendobj), defer);
  });
  ChatHotelServiceMixin.prototype.onChatSink = function (csink) {
    if (!this.decoder) {
      return;
    }
    csink.sessionCall('query', {continuous: true}).then(
      null,
      null,
      this.decoder.onStream.bind(this.decoder)
    );
  };
  ChatHotelServiceMixin.prototype.onNewChatMessage = function (chatm) {
    //console.log('novi chat', chatm);
    this.tellApartment(chatm.to, 'acknowledgeNewChat', chatm); //TODO; do something with to_realm and to_role
  };

  ChatHotelServiceMixin.addMethods = function (klass) {
    lib.inheritMethods(klass, ChatHotelServiceMixin,
      'findUnreadChatForUser',
      'sendChatMessage',
      'onChatSink',
      'onNewChatMessage'
    );
  };

  ChatHotelServiceMixin.propertyHashDescriptor = {
    pathtochatdb: {
      type: ['string', 'array']
    }
  };


  return ChatHotelServiceMixin;
}

module.exports = createServiceMixin;
