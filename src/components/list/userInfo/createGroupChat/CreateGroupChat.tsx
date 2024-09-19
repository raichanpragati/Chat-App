import React from "react";
import "./CreateGroupChat.css";
import { db } from "../../../../lib/firebase";
import { useUserStore } from "../../../../lib/userStore";
import {
  collection,
  doc,
  query,
  where,
  getDocs,
  setDoc,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";
import { toast } from "react-toastify";
import upload from "../../../../lib/upload";
interface Props {
  cancel: () => void;
}

interface user {
  username: string;
  avatar: string;
  blocked: [];
  description: string;
  id: string;
  email: string;
}

const CreateGroupChat = ({ cancel }: Props) => {
  const { currentUser } = useUserStore();
  const [searchInput, setSearchInput] = React.useState("");
  const [foundUser, setFoundUser] = React.useState<user>();
  const [selectedUsers, setSelectedUsers] = React.useState<user[]>([
    currentUser,
  ]);
  const [groupname, setGroupname] = React.useState("");
  const [avatar, setAvatar] = React.useState({
    file: null,
    URL: "",
  });
  const handleSearch = async () => {
    const userRef = collection(db, "users");
    const q = query(userRef, where("username", "==", searchInput));
    try {
      const foundUser = await getDocs(q);
      if (foundUser.docs.length > 0) {
        setFoundUser(foundUser.docs[0].data() as user);
        console.log(foundUser.docs[0].data().username);
      } else {
        throw new Error("User not found");
      }
    } catch (e) {
      console.log(e.message);
    }
  };

  const handleSelectAvatar = (e) => {
    e.preventDefault();
    if (e.target.files.length === 0) return;
    setAvatar({
      file: e.target.files[0],
      URL: URL.createObjectURL(e.target.files[0]),
    });
  };

  const handleCreateGroupChat = async () => {
    if (selectedUsers.length === 0) {
      toast.error("You need to select at least one user");
      return;
    }
    if (groupname === "") {
      toast.error("You need to set a group name");
      return;
    }
    try {
      const groupChatRef = collection(db, "groupchats");
      const userChatRef = collection(db, "userchats");
      const userGroupChats = collection(db, "usergroupchats");

      const newGroupChatRef = doc(groupChatRef);

      const defaultAvatar =
        "https://firebasestorage.googleapis.com/v0/b/webdev-d00f8.appspot.com/o/images%2Favatar.png?alt=media&token=765a3b64-abb5-4fe1-9f02-15b3017504ce";

      let url = defaultAvatar;
      if (avatar.file) {
        url = await upload(avatar.file);
      }

      await setDoc(newGroupChatRef, {
        groupname,
        messages: [],
        id: newGroupChatRef.id,
      });

      selectedUsers.map(async (user) => {
        await updateDoc(doc(userGroupChats, user.id), {
          groupchats: arrayUnion({
            groupchatID: newGroupChatRef.id,
            isLatestImage: false,
            isSeen: user === currentUser ? true : false,
            lastChat: "",
            lastMessageTime: Date.now(),
            recieverIDs: selectedUsers.map((user) => user.id),
            groupchatName: groupname,
            avatar: url,
          }),
        });
      });

      toast.success("Group Chat Created");
      cancel();
    } catch (e) {
      console.log(e.message);
    }
  };

  return (
    <div className="creategroupchat">
      <h2>Create Group Chat</h2>
      <div className="addUsers">
        <div className="controls">
          <input
            type="text"
            placeholder="User To Add"
            onChange={(event) => {
              setSearchInput(event.target.value);
            }}
          />
          <button onClick={handleSearch}>Search</button>
        </div>
        <div className="foundUsers">
          {foundUser && (
            <>
              <img src={foundUser?.avatar} alt="found_user" />
              <div className="texts">
                <p>{foundUser.username}</p>
              </div>
              <button
                onClick={() =>
                  setSelectedUsers(
                    selectedUsers.find((user) => user.id === foundUser.id) ||
                      foundUser.id === currentUser.id
                      ? () => {
                          toast.error("Cant add the same user twice");
                          return selectedUsers;
                        }
                      : [...selectedUsers, foundUser]
                  )
                }
              >
                Add
              </button>
            </>
          )}
        </div>
      </div>
      <div className="selectedUsers">
        <h3>Group Members</h3>

        {selectedUsers.map((user) => (
          <div className="selected">
            <img src={user.avatar} alt="avatar" />
            <p>{user.username}</p>
            <button
              onClick={() =>
                setSelectedUsers((prev) => {
                  return prev.filter((u) => u.id !== user.id);
                })
              }
              disabled={user.id === currentUser.id}
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <div className="groupname">
        <h3>Group Name</h3>
        <div className="selectAvatar">
          <img src={avatar.URL || "/avatar.png"} alt="avatar" />

          <label htmlFor="avatar">Select Avatar</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleSelectAvatar}
            style={{ display: "none" }}
            id="avatar"
          />
        </div>

        <div className="groupnamecontrols">
          <input
            type="text"
            placeholder="Group Name"
            onChange={(e) => setGroupname(e.target.value)}
          />
          <button className="cancel" onClick={cancel}>
            Cancel
          </button>
          <button
            className="create"
            onClick={
              selectedUsers.length < 3
                ? () => toast.error("A group chat must have at least 3 members")
                : handleCreateGroupChat
            }
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateGroupChat;
