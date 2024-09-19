import React from "react";
import "./chatList.css";
import AddUser from "./addUser/addUser";
import { useUserStore } from "../../../lib/userStore";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { auth, db } from "../../../lib/firebase";
import { useChatStore } from "../../../lib/chatStore";
import { DocumentData } from "firebase/firestore/lite";
import { onAuthStateChanged } from "firebase/auth";
import { set } from "firebase/database";

interface groupchat {
  avatar: string;
  groupchatID: string;
  groupchatName: string;
  isSeen: boolean;
  users: [
    {
      id: string;
      avatar: string;
      username: string;
      blocked: [];
    }
  ];
  lastChat: string;
  lastMessageTime: number;
  receiverIDs: string[];
}
interface chat {
  chatID: string;
  isSeen: boolean;
  user: {
    id: string;
    avatar: string;
    username: string;
    blocked: [];
  };
  lastChat: string;
  lastMessageTime: number;
  receiverID: string;
  img: [string, string];
}

const chatList = () => {
  const [isAdding, setIsAdding] = React.useState(false);
  const [chats, setChats] = React.useState([]);
  const [groupchats, setGroupchats] = React.useState([]);
  const { currentUser } = useUserStore();
  const { chatID, changeChat, changeGroupChat, resetChat } = useChatStore();
  const [latestSender, setLatestSender] = React.useState("");
  const [chatListMode, setChatListMode] = React.useState("DMs");
  const [search, setSearch] = React.useState("");
  const [onlineUsers, setOnlineUsers] = React.useState<string[][] | undefined>(
    []
  );

  React.useEffect(() => {
    const usersRef = collection(db, "users");
    const getusers = async () =>
      await getDocs(query(usersRef, where("online", "==", true)));
    const users = getusers().then((response) => {
      const onlineUsers: any = response.docs.map((doc) => {
        if (doc.data().online) {
          return [doc.data().id, doc.data().username];
        }
      });

      if (onlineUsers) {
        setOnlineUsers(onlineUsers);
      }
    });
    console.log(users, "users");
  }, [currentUser.id]);
  React.useEffect(() => {
    console.log(onlineUsers, "onlineUsers");
  }, [onlineUsers]);
  React.useEffect(() => {
    if (!currentUser.id) return; // Ensure currentUser.id is defined
    const onSub1 = onSnapshot(
      doc(db, "userchats", currentUser.id),
      async (response) => {
        const data: DocumentData = response.data()?.chats;
        if (!data) return;

        const promises = data.map(async (chat) => {
          if (!chat.recieverID) return null; // Skip if receiverID is undefined
          const userDocumentRef = doc(db, "users", chat.recieverID);
          const userDocumentSnap = await getDoc(userDocumentRef);
          const user = userDocumentSnap.data();
          return { ...chat, user };
        });

        const chatData: any = await Promise.all(promises);
        console.log(chatData);
        setChats(
          chatData.sort((a, b) => b.lastMessageTime - a.lastMessageTime)
        );
        if (chatID) {
          const chatRef = doc(db, "chats", chatID);
          const chatSnap = await getDoc(chatRef);
          if (chatSnap.exists()) {
            const messages = chatSnap.data()?.messages;
            const latestSender = messages?.[messages.length - 1]?.sender;
            setLatestSender(latestSender);
          }
        }
      }
    );
    const onSub2 = onSnapshot(
      doc(db, "usergroupchats", currentUser.id),
      async (response) => {
        const data: DocumentData = response.data()?.groupchats;
        if (!data) return;

        const promises = data.map(async (chat) => {
          if (!chat.groupchatID) return null; // Skip if groupchatID is undefined

          const getUsers = chat.recieverIDs.map(async (recieverID) => {
            const userDocumentRef = doc(db, "users", recieverID);
            const userDocumentSnap = await getDoc(userDocumentRef);
            const user = userDocumentSnap.data();
            return user;
          });
          const users = await Promise.all(getUsers);
          return { ...chat, users };
        });

        const chatData: any = await Promise.all(promises);
        setGroupchats(
          chatData.sort((a, b) => b.lastMessageTime - a.lastMessageTime)
        );

        console.log("groupchats:", groupchats);
        if (chatID) {
          const chatRef = doc(db, "chats", chatID);
          const chatSnap = await getDoc(chatRef);
          if (chatSnap.exists()) {
            const messages = chatSnap.data()?.messages;
            const latestSender = messages?.[messages.length - 1]?.sender;
            setLatestSender(latestSender);
          }
        }
      }
    );
    console.log("dms:", chats, "groupchats:", groupchats);
    return () => {
      onSub1();
      onSub2();
    };
  }, [currentUser.id, chatID, chatListMode]);

  const handleSelectChat = async (chat) => {
    const userChats = chats.map((c) => {
      const { user, ...rest } = c as chat;
      return rest;
    });

    const chatIndex = userChats.findIndex((c) => c.chatID === chat.chatID);
    if (chatIndex !== -1) {
      userChats[chatIndex].isSeen = true;

      try {
        await updateDoc(doc(db, "userchats", currentUser.id), {
          chats: userChats,
        });
        changeChat(chat.chatID, chat.user);
      } catch (err) {
        console.log(err);
      }
    }
  };

  const handleSelectGroupChat = async (groupchat) => {
    const userGroupChats = groupchats.map((c) => {
      const { users, ...rest } = c as groupchat;
      return rest;
    });

    const chatIndex = userGroupChats.findIndex(
      (c) => c.groupchatID === groupchat.groupchatID
    );
    if (chatIndex !== -1) {
      userGroupChats[chatIndex].isSeen = true;

      try {
        await updateDoc(doc(db, "usergroupchats", currentUser.id), {
          groupchats: userGroupChats,
        });
        changeGroupChat(groupchat, groupchat.groupchatID, groupchat.users);
      } catch (err) {
        console.log(err);
      }
    }
  };

  const handleDisplayMessage = (chat) => {
    if (currentUser.blocked.includes(chat.user.id)) return "User is blocked";
    else if (chat.lastChat === "" && chat.isLatestImage) {
      if (latestSender === currentUser.id) return "You sent an image";
      else return `${chat.user.username} sent an image`;
    } else if (chat.lastChat === "") return "No message yet";
    else return chat.lastChat;
  };

  const handleDisplayMessageGC = (chat) => {
    return chat.lastChat === ""
      ? chat.isLatestImage
        ? "Sent an Image"
        : ""
      : chat.lastChat;
  };

  const handleDisplaySender = (chat) => {
    if (chat.lastChat || chat.isLatestImage)
      return chat.latestSender === currentUser.username
        ? "You: "
        : `${chat.latestSender}: `;
  };
  return (
    <div className="chatList">
      <div className="search">
        <div className="searchBar">
          <img src="/search.png " alt="search" />
          <input
            type="text"
            className="searchbarInput"
            placeholder="Search"
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <img
          src={isAdding ? "/minus.png" : "plus.png"}
          alt="add"
          className="add"
          onClick={() => setIsAdding(!isAdding)}
        />
      </div>
      <div className="selectChats">
        <h4
          onClick={() => setChatListMode("DMs")}
          style={{ color: chatListMode === "DMs" ? "#5183fe" : "white" }}
        >
          DMs
        </h4>
        <h4
          onClick={() => setChatListMode("GCs")}
          style={{ color: chatListMode === "GCs" ? "#5183fe" : "white" }}
        >
          Group Chats
        </h4>
      </div>
      <div className="currentchats">
        {chatListMode === "DMs" &&
          chats.map(
            (chat: chat) =>
              chat.user.username
                .toLowerCase()
                .includes(search.toLowerCase()) && (
                <div
                  className="item"
                  key={chat.chatID}
                  onClick={() => {
                    handleSelectChat(chat);
                  }}
                  style={{
                    backgroundColor: chat.isSeen
                      ? "transparent"
                      : currentUser.blocked.includes(chat.user.id)
                      ? "transparent"
                      : "#5183fe",
                  }}
                >
                  <img
                    src={
                      currentUser.blocked.includes(chat.user.id)
                        ? "/avatar.png"
                        : chat.user.avatar
                    }
                    alt="avatar"
                  />
                  <div className="texts">
                    <span>
                      {onlineUsers?.find((user) => user[0] === chat.user.id)
                        ? "🟢 "
                        : "🔴 "}
                      {currentUser.blocked.includes(chat.user.id)
                        ? "User"
                        : chat.user.username}
                    </span>
                    <p
                      style={{
                        color: chat.isSeen
                          ? "rgba(127, 139, 141, 0.911)"
                          : currentUser.blocked.includes(chat.user.id)
                          ? "rgba(127, 139, 141, 0.911)"
                          : "white",
                      }}
                    >
                      {handleDisplayMessage(chat)}
                    </p>
                  </div>
                </div>
              )
          )}

        {chatListMode === "GCs" && (
          <div>
            {groupchats.map(
              (chat: groupchat) =>
                chat.groupchatName
                  .toLowerCase()
                  .includes(search.toLowerCase()) && (
                  <div
                    className="item"
                    key={chat.groupchatID}
                    onClick={() => {
                      handleSelectGroupChat(chat);
                    }}
                    style={{
                      backgroundColor: chat.isSeen ? "transparent" : "#5183fe",
                    }}
                  >
                    <img src={chat.avatar || "/avatar.png"} alt="avatar" />
                    <div className="texts">
                      <span>{chat.groupchatName}</span>
                      <p style={{ color: chat.isSeen ? "#dddddd35" : "white" }}>
                        {handleDisplaySender(chat)}
                        {handleDisplayMessageGC(chat)}
                      </p>
                    </div>
                  </div>
                )
            )}
          </div>
        )}
      </div>
      {isAdding && <AddUser closeFunc={() => setIsAdding(false)} />}
    </div>
  );
};
export default chatList;
