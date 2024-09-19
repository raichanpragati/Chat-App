import React, { Fragment } from "react";
import "./addUser.css";
import {
  collection,
  DocumentData,
  getDocs,
  getDoc,
  query,
  serverTimestamp,
  setDoc,
  doc,
  where,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";
import { db } from "../../../../lib/firebase";
import { toast } from "react-toastify";
import { useUserStore } from "../../../../lib/userStore";

interface Props {
  closeFunc: () => void;
}
const AddUser = ({ closeFunc }: Props) => {
  const [user, setUser] = React.useState<DocumentData>([]);
  const { currentUser } = useUserStore();

  const handleSearch = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const username = formData.get("username");

    try {
      const userDocRef = collection(db, "users");

      const q = query(userDocRef, where("username", "==", username));

      const userDocSnap = await getDocs(q);

      if (!userDocSnap.empty) {
        setUser(userDocSnap.docs[0].data());
      }
    } catch (err) {
      console.log(err);
    }
  };

  const handleAdd = async () => {
    const chatRef = collection(db, "chats");
    const userChatRef = collection(db, "userchats");

    const currentUserChats = await getDoc(doc(userChatRef, currentUser.id));

    const check =
      currentUserChats
        .data()!
        .chats?.find((chat) => chat.recieverID === user.id) ||
      currentUser.id === user.id;

    if (check) {
      toast.error("User Already Added");
      return;
    }

    try {
      const newChatRef = doc(chatRef);

      await setDoc(newChatRef, {
        createdAt: serverTimestamp(),
        messages: [],
      });

      await updateDoc(doc(userChatRef, currentUser.id), {
        chats: arrayUnion({
          lastChat: "",
          chatID: newChatRef.id,
          recieverID: user.id,
          lastMessageTime: Date.now(),
        }),
      });

      await updateDoc(doc(userChatRef, user.id), {
        chats: arrayUnion({
          lastChat: "",
          chatID: newChatRef.id,
          recieverID: currentUser.id,
          lastMessageTime: Date.now(),
        }),
      });

      toast.success("User Added Successfully");
    } catch (err) {
      console.log(err);
    }
  };
  return (
    <div className="addUser">
      <div className="image">
        <img src="/icons8-multiply-100.png" alt="back" onClick={closeFunc} />
      </div>
      <form onSubmit={handleSearch}>
        <input type="text" placeholder="Username" name="username" />
        <button>Search</button>
      </form>
      <div className="usersFound">
        {user.length === 0 ? (
          <div>No Users Found</div>
        ) : (
          <div className="detail">
            <img src={user.avatar} alt="" />
            <span>{user.username}</span>
            <button onClick={handleAdd}>Add User</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddUser;
