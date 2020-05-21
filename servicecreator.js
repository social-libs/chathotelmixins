function createServiceMixin (execlib, chatclientlib, vararglib) {
  'use strict';

  var execSuite = execlib.execSuite,
    lib = execlib.lib,
    q = lib.q,
    qlib = lib.qlib,
    genericDependentMethodCreator = vararglib.genericDependentMethodCreator,
    genfns = {
      fetchChatMessagesForConversation: genericDependentMethodCreator('getMessages', 4)
    };

  function ChatHotelServiceMixin (prophash) {
    if (!lib.isFunction(this.findRemote)) {
      throw new lib.Error('REMOTESERVICELISTENERSERVICEMIXIN_NOT_IMPLEMENTED', 'Your class does not implement the RemoteServiceListenerServiceMixin');
    }
    /*
    this.findRemote(prophash.pathtochatdb || 'Chat', null, 'Chat');
    this.state.data.listenFor('Chat', this.onChatSink.bind(this), true);
    this.chatConversationNotificationEvent = new lib.HookCollection();
    */
    this.chatConversationNotificationEvents = new lib.Map();
    if (lib.isArray(prophash.chats)) {
      prophash.chats.forEach(findRemoter.bind(null, this));
    }
  }
  ChatHotelServiceMixin.prototype.destroy = function () {
    /*
    if (this.chatConversationNotificationEvent) {
      this.chatConversationNotificationEvent.destroy();
    }
    this.chatConversationNotificationEvent = null;
    */
    if (this.chatConversationNotificationEvents) {
      lib.containerDestroyAll(this.chatConversationNotificationEvents);
      this.chatConversationNotificationEvents.destroy();
    }
    this.chatConversationNotificationEvents = null;
  };

  function findRemoter (hotel, chat) {
    try {
    var chatname;
    if (!(chat && chat.path && chat.name)) {
      throw new lib.Error('INVALID_RWC_DESCRIPTOR', 'Chat descriptor must be an Object with properties "path" and "name"');
    }
    chatname = chat.name;
    hotel.chatConversationNotificationEvents.add(chatname, new lib.HookCollection());
    hotel.findRemote(chat.path, null, chatname);
    hotel.state.data.listenFor(chatname, onChatSinkFunc.bind(hotel, chatname), true);
    //this.chatConversationNotificationEvent = new lib.HookCollection();
    chatname = null;
    } catch(e) {
      console.error(e);
      throw e;
    }
  }

  /*
  ChatHotelServiceMixin.prototype.fetchChatMessagesForConversation = execSuite.dependentServiceMethod([], ['Chat'], genfns.fetchChatMessagesForConversation);
  ChatHotelServiceMixin.prototype.fetchChatMessagesForConversation = execSuite.dependentServiceMethod([], ['Chat'], function (chatsink, userid, conversationid, oldestmessageid, howmany, defer) {
    qlib.promise2defer(chatsink.call('getMessages', userid, conversationid, oldestmessageid, howmany), defer);
  });
  ChatHotelServiceMixin.prototype.fetchChatConversationsForUser = execSuite.dependentServiceMethod([], ['Chat'], fetchChatConversationsForUserFunc);
  ChatHotelServiceMixin.prototype.initiateChatConversationsForUserWithUsers = execSuite.dependentServiceMethod([], ['Chat'], initiateChatConversationsForUserWithUsersFunc);
  ChatHotelServiceMixin.prototype.markMessageRcvd = execSuite.dependentServiceMethod([], ['Chat'], markMessageRcvdFunc);
  ChatHotelServiceMixin.prototype.markMessageSeen = execSuite.dependentServiceMethod([], ['Chat'], markMessageSeenFunc);
  ChatHotelServiceMixin.prototype.sendChatMessage = execSuite.dependentServiceMethod([], ['Chat'], sendChatMessageFunc);
  */

  function addMethodsOnRealm (klass, realm) {
    klass.prototype['getChatConversations'+'On'+realm] = getChatConversationsFunc.bind(null, realm);
    klass.prototype['fetchChatConversationsForUser'+'On'+realm] = execSuite.dependentServiceMethod([], [realm], fetchChatConversationsForUserFunc);
    klass.prototype['initiateChatConversationsWithUsers'+'On'+realm] = initiateChatConversationsWithUsersFuncCreator(realm);
    klass.prototype['initiateChatConversationsForUserWithUsers'+'On'+realm] = execSuite.dependentServiceMethod([], [realm], initiateChatConversationsForUserWithUsersFunc);
    klass.prototype['getChatMessages'+'On'+realm] = getChatMessagesFuncCreator(realm);
    klass.prototype['fetchChatMessagesForConversation'+'On'+realm] = execSuite.dependentServiceMethod([], [realm], genfns.fetchChatMessagesForConversation);
    klass.prototype['markMessageRcvd'+'On'+realm] = execSuite.dependentServiceMethod([], [realm], markMessageRcvdFunc);
    klass.prototype['markMessageSeen'+'On'+realm] = execSuite.dependentServiceMethod([], [realm], markMessageSeenFunc);
    klass.prototype['sendChatMessage'+'On'+realm] = execSuite.dependentServiceMethod([], [realm], sendChatMessageFunc);
    klass.prototype['editChatMessage'+'On'+realm] = execSuite.dependentServiceMethod([], [realm], editChatMessageFunc);
    klass.prototype['reportChatActivity'+'On'+realm] = execSuite.dependentServiceMethod([], [realm], reportChatActivityFunc);
    klass.prototype['createNewChatGroupWithMembers'+'On'+realm] = execSuite.dependentServiceMethod([], [realm], createNewChatGroupWithMembersFunc);
    realm = null;
  }

  ChatHotelServiceMixin.addMethods = function (klass, realm) {
    addMethodsOnRealm(klass, realm);
    /*
    lib.inheritMethods(klass, ChatHotelServiceMixin
      ,'getChatConversations'
      ,'fetchChatConversationsForUser'
      ,'initiateChatConversationsWithUsers'
      ,'initiateChatConversationsForUserWithUsers'
      ,'getChatMessages'
      ,'fetchChatMessagesForConversation'
      ,'markMessageRcvd'
      ,'markMessageSeen'
      ,'sendChatMessage'
    );
    */
  };

  ChatHotelServiceMixin.propertyHashDescriptor = {
    pathtochatdb: {
      type: ['string', 'array']
    }
  };
  //functions for dependentServiceMethod
  function fetchChatConversationsForUserFunc (chatsink, username, defer) {
    qlib.promise2defer(chatsink.call('getAllConversations', username), defer);
  }
  function initiateChatConversationsForUserWithUsersFunc (chatsink, username, usernames, defer) {
    qlib.promise2defer(chatsink.call('initiateChatConversationsWithUsers', username, usernames), defer);
  }
  function markMessageRcvdFunc (chatsink, userid, conversationid, messageid, defer) {
    if (!userid) {
      defer.reject(new lib.Error('NO_CHAT_USERID', 'You must specify the chat userid'));
      return;
    }
    if (!conversationid) {
      defer.reject(new lib.Error('NO_CHAT_CONVERSATIONID', 'You must specify the chat conversationid'));
      return;
    }
    if (!messageid) {
      defer.reject(new lib.Error('NO_CHAT_MESSAGEID', 'You must specify the chat messageid'));
      return;
    }
    qlib.promise2defer(chatsink.call('markMessageRcvd', this.apartmentName2OuterName(userid), conversationid, messageid), defer);
  }
  function markMessageSeenFunc (chatsink, userid, conversationid, messageid, defer) {
    if (!userid) {
      defer.reject(new lib.Error('NO_CHAT_USERID', 'You must specify the chat userid'));
      return;
    }
    if (!conversationid) {
      defer.reject(new lib.Error('NO_CHAT_CONVERSATIONID', 'You must specify the chat conversationid'));
      return;
    }
    if (!messageid) {
      defer.reject(new lib.Error('NO_CHAT_MESSAGEID', 'You must specify the chat messageid'));
      return;
    }
    qlib.promise2defer(chatsink.call('markMessageSeen', this.apartmentName2OuterName(userid), conversationid, messageid), defer);
  }
  function sendChatMessageFunc (chatsink, from, togroup, to, msg, options, defer) {
    if (!from) {
      defer.reject(new lib.Error('NO_CHAT_SENDER', 'You must specify the message sender'));
      return;
    }
    if (!(togroup || to)) {
      defer.reject(new lib.Error('NO_CHAT_RECIPIENT', 'Your must specify either the receiving group or the receiving peer'));
      return;
    }
    if (!lib.isString(msg) && msg.length) {
      defer.reject(new lib.Error('NO_CHAT_MESSAGE', 'You must specify the message to be sent'));
      return;
    }
    qlib.promise2defer(chatsink.call('processNewMessage', this.apartmentName2OuterName(from), togroup, to, msg, options), defer);
  }
  function editChatMessageFunc (chatsink, from, togroup, to, msg, options, defer) {
    if (!from) {
      defer.reject(new lib.Error('NO_CHAT_SENDER', 'You must specify the message sender'));
      return;
    }
    if (!(togroup || to)) {
      defer.reject(new lib.Error('NO_CHAT_RECIPIENT', 'Your must specify either the receiving group or the receiving peer'));
      return;
    }
    if (!lib.isString(msg) && msg.length) {
      defer.reject(new lib.Error('NO_CHAT_MESSAGE', 'You must specify the message to be sent'));
      return;
    }
    qlib.promise2defer(chatsink.call('editMessage', this.apartmentName2OuterName(from), togroup, to, msg, options), defer);
  }
  function reportChatActivityFunc (chatsink, userid, conversationid, defer) {
    if (!userid) {
      defer.reject(new lib.Error('NO_CHAT_USERID', 'You must specify the chat userid'));
      return;
    }
    if (!conversationid) {
      defer.reject(new lib.Error('NO_CHAT_CONVERSATIONID', 'You must specify the chat conversationid'));
      return;
    }
    qlib.promise2defer(chatsink.call('reportChatActivity', this.apartmentName2OuterName(userid), conversationid), defer);
  }
  function createNewChatGroupWithMembersFunc (chatsink, creatorid, groupname, membersarry, defer) {
    if (!creatorid) {
      defer.reject(new lib.Error('NO_CHAT_GROUP_CREATOR_ID', 'You must specify the new chat group creatorid'));
      return;
    }
    if (!groupname) {
      defer.reject(new lib.Error('NO_CHAT_GROUP_NAME', 'You must specify the chat group name'));
      return;
    }
    if (!lib.isArray(membersarry)) {
      defer.reject(new lib.Error('NO_CHAT_GROUP_MEMBERS', 'You must specify the chat group members as an array'));
      return;
    }
    qlib.promise2defer(chatsink.call('createNewGroupWithMembers', this.apartmentName2OuterName(creatorid), groupname, membersarry), defer);
  }
  //endof functions for dependentServiceMethod
  //functions for other methods
  function getChatConversationsFunc (realm, username) {
    //non-queued
    var evnt, job;
    if (!this.chatConversationNotificationEvents) {
      return q([]);
    }
    evnt = this.chatConversationNotificationEvents.get(realm);
    if (!evnt) {
      return q([]);
    }
    job = new chatclientlib.AllConversationsOfUserFetcherJob(evnt, this.fetchChatConversationsForUser.bind(this), username);
    return job.go();
  }
  function initiateChatConversationsWithUsersFuncCreator (realm) {
    return function initiateChatConversationsWithUsersFunc (username, usernames) {
      //non-queued
      var evnt, job;
      if (!this.chatConversationNotificationEvents) {
        return q([]);
      }
      evnt = this.chatConversationNotificationEvents.get(realm);
      if (!evnt) {
        return q([]);
      }
      job = new chatclientlib.ConversationsOfUserForUsersInitiatorJob(evnt, this['initiateChatConversationsForUserWithUsers'+'On'+realm].bind(this), username, usernames);
      return job.go();
    };
  }
  function getChatMessagesFuncCreator (realm) {
    return function getChatMessagesFunc (userid, conversationid, oldestmessageid, howmany) {
      //non-queued
      var evnt, job, ret, _rlm;
      if (!this.chatConversationNotificationEvents) {
        return q([]);
      }
      evnt = this.chatConversationNotificationEvents.get(realm);
      if (!evnt) {
        return q([]);
      }
      job = new chatclientlib.MessageFetcherJob(evnt, this['fetchChatMessagesForConversation'+'On'+realm].bind(this), userid, conversationid, oldestmessageid, howmany);
      ret = job.go();
      _rlm = realm;
      ret.then(null, null, markMessageRcvdOnRealmer.bind(this, _rlm));
      _rlm = null;
      return ret;
    };
  }
  function onChatSinkFunc (realm, csink) {
    csink.call('getNotifications').then(
      null,
      null,
      onChatNotificationFunc.bind(this, realm)
    );
    realm = null;
  }
  function onChatNotificationFunc (realm, ntf) {
    var evnt;
    if (!(ntf && lib.isArray(ntf.affected) && ntf.affected.length>0)) {
      return;
    }
    evnt = this.chatConversationNotificationEvents.get(realm);
    if (!evnt) {
      return;
    }
    evnt.fire(ntf);
    ntf.affected.forEach(notifyUserOnChatFunc.bind(this, realm, ntf));
    realm = null;
    ntf = null;
  }
  function notifyUserOnChatFunc (realm, ntf, username) {
    this.tellApartment(this.outerName2ApartmentName(username), 'acknowledgeChatNotification', [realm, ntf]);
  }
  //endof functions for other methods
  
  //statics, "this" matters
  function markMessageRcvdOnRealmer (rlm, msgtomarkobj) {
    this['markMessageRcvd'+'On'+rlm](msgtomarkobj.userid, msgtomarkobj.conversationid, msgtomarkobj.messageid);
  }
  //endof statics


  return ChatHotelServiceMixin;
}
module.exports = createServiceMixin;
