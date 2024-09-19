import React from "react";
import "./changeUsername.css";
import { updateDoc, doc } from "firebase/firestore";
import { db } from "../../../../lib/firebase";
import { useUserStore } from "../../../../lib/userStore";
interface Props {
  cancel: () => void;
}
const ChangeUsername = ({ cancel }: Props) => {
  const { currentUser } = useUserStore();
  const [username, setUsername] = React.useState("");

  const updateUsername = async () => {
    const newUsername = username;
    console.log(currentUser.id);
    const userRef = doc(db, "users", currentUser?.id);
    try {
      await updateDoc(userRef, {
        username: newUsername,
      });
    } catch (err) {
      console.log(err);
      document.querySelector(".header")!.innerHTML = "Error. Try later";
      return;
    }
    document.querySelector(".header")!.innerHTML = "Username Changed!";
    setUsername("");
    document.querySelector("input")!.value = "";
  };

  return (
    <div className="changeUsername">
      <img src="/icons8-multiply-100.png" alt="" onClick={cancel} />
      <h2 className="header">Change Username</h2>

      <input
        type="text"
        placeholder="New Username"
        onChange={(e) => setUsername(e.target.value)}
      />
      <button
        onClick={() => {
          updateUsername();
        }}
      >
        Change
      </button>
    </div>
  );
};

export default ChangeUsername;
