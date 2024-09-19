import React from "react";
import "./Chat.css";
import EmojiPicker from "emoji-picker-react";
import { db } from "../../lib/firebase";
import {
  arrayUnion,
  collection,
  doc,
  DocumentData,
  getDoc,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";
import { useChatStore } from "../../lib/chatStore";
import { useUserStore } from "../../lib/userStore";
import upload from "../../lib/upload";
import { set } from "firebase/database";

interface Props {
  setShowDetail: () => void;
  showDetail: boolean;
}

interface image {
  file: null;
  imageURL: string;
}

const Chat = ({ setShowDetail, showDetail }: Props) => {
  const [showEmoji, setShowEmoji] = React.useState(false);
  const [message, setMessage] = React.useState("");
  const [chat, setChat] = React.useState<DocumentData>();
  const [image, setImage] = React.useState<image>({ file: null, imageURL: "" });
  const [userNames, setUserNames] = React.useState<any[]>([]);
  const endRef = React.useRef<HTMLDivElement>(null);
  const { chatID, user, isRecieverBlocked, isGroupChat, groupChat, users } =
    useChatStore();
  const { currentUser } = useUserStore();

  React.useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat?.messages]); //chat.messages is the dependency here because we want to scroll to the end of the chat after all messages are loaded

  React.useEffect(() => {
    if (isGroupChat) {
      const chatRef = doc(db, "groupchats", chatID);
      onSnapshot(chatRef, (response) => {
        setChat(response.data());
      });
      console.log(users, "users");
      const set = users.map((user) => {
        return [user.id, user.username];
      });
      setUserNames(set);
      console.log(userNames, "usernames");
    } else {
      const chatRef = doc(db, "chats", chatID);
      onSnapshot(chatRef, (response) => {
        setChat(response.data());
      });
    }
  }, [chatID, isGroupChat]); //this useEffect listens to changes in the chatID and fetches the chat data from the database.

  const displayUsername = (id: string) => {
    const username = userNames.map((user) => {
      if (user[0] === id) {
        return user[1];
      }
    });
    return username;
  };

  const handleEmojiClick = (event) => {
    setMessage(message + event.emoji);
  };

  const handleSend = async () => {
    if (message === "" && !image.file) return;
    try {
      let imageURL: [string, string] | null = null;
      if (image?.file) {
        imageURL = await upload(image.file);
      }

      const [firebaseImgURL, fileNameInDatabase] = imageURL ?? ["", ""];

      const chatCollectionRef = collection(
        db,
        isGroupChat ? "groupchats" : "chats"
      );
      const messageRef = doc(chatCollectionRef, chatID);
      await updateDoc(messageRef, {
        messages: arrayUnion({
          message: message,
          sender: currentUser.id,
          time: Date(),
          ...(image.imageURL && {
            img: firebaseImgURL,
            filename: fileNameInDatabase,
          }),
        }),
      }); // reference and update the chats collection with the new message

      const userIDs = isGroupChat
        ? users.map((user) => {
            return user.id;
          })
        : [user.id, currentUser.id];
      // this function updates users on both ends' userchats with the new message
      userIDs.forEach(async (id) => {
        const userChatRef = doc(
          db,
          isGroupChat ? "usergroupchats" : "userchats",
          id
        );
        const userChatSnap = await getDoc(userChatRef);

        if (userChatSnap.exists()) {
          const userChatData = userChatSnap.data(); // get the userchat data of the recepient or currentUser
          console.log(userChatData, "userchatdata");
          const userIndex = isGroupChat
            ? userChatData.groupchats.findIndex(
                (chat) => chat.groupchatID === chatID
              )
            : userChatData.chats.findIndex((chat) => chat.chatID === chatID);

          //make necessary changes
          if (!isGroupChat) {
            userChatData.chats[userIndex].lastChat = message;
            userChatData.chats[userIndex].lastMessageTime = Date.now();
            userChatData.chats[userIndex].isSeen =
              id === currentUser.id ? true : false;
            await updateDoc(userChatRef, {
              chats: userChatData.chats,
            });
          } else {
            userChatData.groupchats[userIndex].lastChat = message;
            userChatData.groupchats[userIndex].lastMessageTime = Date.now();
            userChatData.groupchats[userIndex].isSeen =
              id === currentUser.id ? true : false;
            userChatData.groupchats[userIndex].latestSender =
              currentUser.username;
            userChatData.groupchats[userIndex].isLatestImage = image.file
              ? true
              : false;
            await updateDoc(userChatRef, {
              groupchats: userChatData.groupchats,
            });
          }
        }
      });

      setMessage("");
      setImage({ file: null, imageURL: "" });
    } catch (err) {
      console.log(err);
    }
  };

  const [time, setTime] = React.useState(new Date());

  React.useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 60000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const handleTimeAgo = (time: string) => {
    const date = new Date(time);
    const diff = new Date().getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) {
      return "Just Now";
    } else if (minutes < 60) {
      return `${minutes}m ago`;
    } else if (minutes < 1440) {
      return `${Math.floor(minutes / 60)}h ago`;
    } else {
      return `${Math.floor(minutes / 1440)}d ago`;
    }
  };

  const handleImage = (event) => {
    event.preventDefault();
    const file = event.target.files[0];
    setImage({
      file: file,
      imageURL: URL.createObjectURL(file),
    });
    console.log("inserted Image: ", file);
  };

  return (
    <div className="chat" style={{ flex: showDetail ? "2" : "3" }}>
      <div className="top">
        <div className="user">
          <img
            src={isGroupChat ? groupChat.avatar : user.avatar}
            alt="userImage"
          />
          <div className="texts">
            <span>{isGroupChat ? groupChat.groupchatName : user.username}</span>
            <p>{isGroupChat ? "" : user.description}</p>
          </div>
        </div>
        <div className="icons">
          <img src="/info.png" alt="more" onClick={() => setShowDetail()} />
        </div>
      </div>
      <div className="center">
        {isRecieverBlocked ? (
          <div className="blocked">
            <p>You have blocked this user</p>
          </div>
        ) : (
          chat?.messages.map((message, index) => (
            <div
              className={
                message.sender === currentUser.id ? "message own" : "message"
              }
              key={message.lastMessageTime}
            >
              {isGroupChat && message.sender !== currentUser.id && (
                <p className="username">{displayUsername(message.sender)}</p>
              )}
              <div className="texts">
                {message.img && <img src={message.img} alt="img" />}
                {message.message && <p>{message.message}</p>}
              </div>
              {chat.messages.length - 1 === index && (
                <p className="time">{handleTimeAgo(message.time)}</p>
              )}
            </div>
          ))
        )}

        <div ref={endRef}></div>
      </div>

      <div
        className="bottom"
        style={{
          display: isRecieverBlocked ? "none" : "flex",
        }}
      >
        {image.file && (
          <div className="selected-image">
            <div className="cancel">
              <img
                src="/icons8-multiply-100.png"
                alt="cancel"
                onClick={() =>
                  setImage({
                    file: null,
                    imageURL: "",
                  })
                }
              />
            </div>
            <div className="texts">
              <img src={image.imageURL} alt="sent_image" />
            </div>
          </div>
        )}
        <div className="message-controls">
          <div className="icons">
            <label htmlFor="file">
              <img src="/img.png" alt="img" />
            </label>
            <input
              type="file"
              id="file"
              onChange={(e) => handleImage(e)}
              style={{ display: "none" }}
            />
          </div>
          <textarea
            placeholder="Type a message"
            className="messageInput"
            onChange={(event) => {
              setMessage(event.target.value);
              const textarea = event.target as HTMLTextAreaElement;
              textarea.style.height = "36px";
              textarea.style.height = textarea.scrollHeight + "px";
            }}
            value={message}
            onKeyDown={(event) => {
              event.key === "Enter" && handleSend();
            }}
          />
          <div className="emoji">
            <img
              src="/emoji.png"
              alt=""
              onClick={() => setShowEmoji(!showEmoji)}
            />
            <div className={showDetail ? "emojipicker" : "emojipicker full"}>
              <EmojiPicker open={showEmoji} onEmojiClick={handleEmojiClick} />
            </div>
          </div>
          <button className="send" onClick={handleSend}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
