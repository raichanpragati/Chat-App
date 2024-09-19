import { create } from "zustand";
import { useUserStore } from "./userStore";

export const useChatStore = create((set) => ({
  //Private chat
  chatID: null,
  user: null,
  isCurrentUserBlocked: false,
  isRecieverBlocked: false,

  //Groupchat
  users: [],
  isGroupChat: false,
  groupChat: null,

  changeChat: (chatID, user) => {
    const currentUser = useUserStore.getState().currentUser;
    if (currentUser.blocked.includes(user.id)) {
      console.log("reciever is blocked");
      return set({
        isGroupChat: false,
        chatID,
        user,
        isCurrentUserBlocked: false,
        isRecieverBlocked: true,
      });
    }
    if (user.blocked.includes(currentUser.id)) {
      console.log("user is blocked");
      set({
        isGroupChat: false,
        chatID,
        user,
        isCurrentUserBlocked: true,
        isRecieverBlocked: false,
      });
    } else {
      console.log("no one is blocked");
      return set({
        isGroupChat: false,
        chatID,
        user,
        isCurrentUserBlocked: false,
        isRecieverBlocked: false,
      });
    }
  },

  resetChat: () => {
    return set({
      chatID: null,
      user: null,
      isCurrentUserBlocked: false,
      isRecieverBlocked: false,
    });
  },

  changeBlock: () => {
    return set((state) => ({
      ...state,
      isRecieverBlocked: !state.isRecieverBlocked,
    }));
  },

  changeGroupChat: (groupChat, groupchatID, users) => {
    return set({
      isGroupChat: true,
      chatID: groupchatID,
      users,
      groupChat,
      isCurrentUserBlocked: false,
      isRecieverBlocked: false,
    });
  },
}));
