import React from "react";
import "./Logout.css";
import { signOut } from "firebase/auth";
import { auth } from "../../../../lib/firebase";
import { useUserStore } from "../../../../lib/userStore";

interface Props {
  cancel: () => void;
}
const ChangeUsername = ({ cancel }: Props) => {
  const { currentUser, setOffline } = useUserStore();
  return (
    <div className="Logout">
      <h2>Logout?</h2>

      <button
        className="logout"
        onClick={() => {
          setOffline(currentUser.id);
          signOut(auth);
        }}
      >
        Logout
      </button>
      <button className="cancel" onClick={cancel}>
        Cancel
      </button>
    </div>
  );
};

export default ChangeUsername;
