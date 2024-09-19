import React from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../../../lib/firebase";
import { useUserStore } from "../../../../lib/userStore";
import "./changeDescription.css";
interface Props {
  cancel: () => void;
}
const ChangeUsername = ({ cancel }: Props) => {
  const [description, setDescription] = React.useState("");
  const { currentUser } = useUserStore();

  const updateDescription = async () => {
    const docRef = doc(db, "users", currentUser.id);
    try {
      await updateDoc(docRef, {
        description: description,
      });
    } catch (err) {
      console.log(err);
      document.querySelector(".header")!.innerHTML = "Error. Try later";
      return;
    }
    document.querySelector(".header")!.innerHTML = "Description Changed!";
    setDescription("");
  };

  return (
    <div className="changeDescription">
      <img src="/icons8-multiply-100.png" alt="" onClick={cancel} />
      <h2 className="header">Change Description</h2>

      <input
        type="text"
        placeholder="New Description"
        onChange={(e) => setDescription(e.target.value)}
      />
      <button onClick={() => updateDescription()}>Change</button>
    </div>
  );
};

export default ChangeUsername;
