import React from "react";
import "./Login.css";
import { toast } from "react-toastify";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { auth, db } from "../../lib/firebase";
import { setDoc, doc } from "firebase/firestore";
import upload from "../../lib/upload";

const Login = () => {
  const defaultAvatar =
    "https://firebasestorage.googleapis.com/v0/b/webdev-d00f8.appspot.com/o/images%2Favatar.png?alt=media&token=765a3b64-abb5-4fe1-9f02-15b3017504ce";
  const [avatar, setAvatar] = React.useState({
    file: null,
    url: "",
  });

  const [loading, setLoading] = React.useState(false);

  const handleAvatar = (e) => {
    e.preventDefault();
    if (e.target.files.length === 0) return;
    setAvatar({
      file: e.target.files[0],
      url: URL.createObjectURL(e.target.files[0]),
    });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    const { username, email, password } = Object.fromEntries(formData);
    try {
      const res = await createUserWithEmailAndPassword(
        auth,
        email.toString(),
        password.toString()
      );

      let imageURL = defaultAvatar;
      if (avatar.file) {
        imageURL = await upload(avatar.file);
        1;
      }

      await setDoc(doc(db, "users", res.user.uid), {
        username,
        email,
        avatar: imageURL,
        id: res.user.uid,
        blocked: [],
      });

      await setDoc(doc(db, "userchats", res.user.uid), {
        chats: [],
      });

      toast.success("User created successfully! You can login now");
    } catch (err) {
      console.log(err);
      toast.error(err.message);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    console.log("login");
    const formData = new FormData(e.target);
    const { email, password } = Object.fromEntries(formData);

    try {
      await signInWithEmailAndPassword(
        auth,
        email.toString(),
        password.toString()
      );
    } catch (err) {
      console.log(err);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="login">
      <div className="item">
        <h2>Welcome Back</h2>
        <form onSubmit={handleLogin}>
          <input type="text" placeholder="Email" name="email" />
          <input type="password" placeholder="Password" name="password" />
          <button type="submit">Login</button>
        </form>
      </div>
      <div className="separator"></div>
      <div className="item">
        <h2>Create an Account</h2>
        <form onSubmit={handleRegister}>
          <label htmlFor="uploadphoto">
            <img src={avatar.url || "/avatar.png"} alt="" />
            Upload a photo
          </label>
          <input
            type="file"
            style={{ display: "none" }}
            id="uploadphoto"
            onChange={handleAvatar}
          />
          <input type="text" placeholder="username" name="username" />
          <input type="text" placeholder="email" name="email" />
          <input type="password" placeholder="password" name="password" />
          <button type="submit">Sign Up</button>
        </form>
      </div>
    </div>
  );
};

export default Login;
