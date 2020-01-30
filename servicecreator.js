function createServiceMixin (execlib, chatclientlib) {
  'use strict';

  var execSuite = execlib.execSuite,
    lib = execlib.lib,
    qlib = lib.qlib;

  function ChatHotelServiceMixin (prophash) {
    if (!lib.isFunction(this.findRemote)) {
      throw new lib.Error('REMOTESERVICELISTENERSERVICEMIXIN_NOT_IMPLEMENTED', 'Your class does not implement the RemoteServiceListenerServiceMixin');
    }
    this.findRemote(prophash.pathtochatdb || 'Chat', null, 'Chat');
    this.state.data.listenFor('Chat', this.onChatSink.bind(this), true);
    this.chatConversationNotificationEvent = new lib.HookCollection();
  }
  ChatHotelServiceMixin.prototype.destroy = function () {
    if (this.chatConversationNotificationEvent) {
      this.chatConversationNotificationEvent.destroy();
    }
    this.chatConversationNotificationEvent = null;
  };
  ChatHotelServiceMixin.prototype.getChatConversations = function (username) {
    //non-queued
    var job = new chatclientlib.AllConversationsOfUserFetcherJob(this.chatConversationNotificationEvent, this.fetchChatConversationsForUser.bind(this), username);
    return job.go();
  };
  ChatHotelServiceMixin.prototype.getChatMessages = function (userid, conversationid, oldestmessageid, howmany) {
    //non-queued
    var job = new chatclientlib.MessageFetcherJob(this.chatConversationNotificationEvent, this.fetchChatMessagesForConversation.bind(this), userid, conversationid, oldestmessageid, howmany);
    return job.go();
  };
  ChatHotelServiceMixin.prototype.fetchChatMessagesForConversation = execSuite.dependentServiceMethod([], ['Chat'], function (chatsink, userid, conversationid, oldestmessageid, howmany, defer) {
    qlib.promise2defer(chatsink.call('getMessages', userid, conversationid, oldestmessageid, howmany), defer);
  });
  ChatHotelServiceMixin.prototype.fetchChatConversationsForUser = execSuite.dependentServiceMethod([], ['Chat'], function (chatsink, username, defer) {
    qlib.promise2defer(chatsink.call('getAllConversations', username), defer);
  });
  ChatHotelServiceMixin.prototype.sendChatMessage = execSuite.dependentServiceMethod([], ['Chat'], function (chatsink, from, togroup, to, msg, defer) {
    if (!from) {
      defer.reject(new lib.Error('NO_CHAT_SENDER', 'You must specify the message sender'));
    }
    if (!(togroup || to)) {
      defer.reject(new lib.Error('NO_CHAT_RECIPIENT', 'Your must specify either the receiving group or the receiving peer'));
      return;
    }
    if (!lib.isString(msg) && msg.length) {
      defer.reject(new lib.Error('NO_CHAT_MESSAGE', 'You must specify the message to be sent'));
      return;
    }
    qlib.promise2defer(chatsink.call('processNewMessage', this.apartmentName2OuterName(from), togroup, to, msg), defer);
  });
  ChatHotelServiceMixin.prototype.onChatSink = function (csink) {
    csink.call('getNotifications').then(
      null,
      null,
      this.onChatNotification.bind(this)
    );
  };
  ChatHotelServiceMixin.prototype.onChatNotification = function (ntf) {
    if (!(ntf && lib.isArray(ntf.affected) && ntf.affected.length>0)) {
      return;
    }
    if (!this.chatConversationNotificationEvent) {
      return;
    }
    this.chatConversationNotificationEvent.fire(ntf);
    ntf.affected.forEach(this.notifyUserOnChat.bind(this, ntf));
  };
  ChatHotelServiceMixin.prototype.notifyUserOnChat = function (ntf, username) {
    this.tellApartment(this.outerName2ApartmentName(username), 'acknowledgeChatNotification', ntf);
  }

  ChatHotelServiceMixin.addMethods = function (klass) {
    lib.inheritMethods(klass, ChatHotelServiceMixin
      ,'getChatConversations'
      ,'fetchChatConversationsForUser'
      ,'getChatMessages'
      ,'fetchChatMessagesForConversation'
      ,'sendChatMessage'
      ,'onChatSink'
      ,'onChatNotification'
      ,'notifyUserOnChat'
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
