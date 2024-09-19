import { useEffect, useState } from "react";
import Chat from "./components/chat/Chat";
import Detail from "./components/detail/Detail";
import List from "./components/list/List";
import Login from "./components/login/Login";
import Notification from "./components/notification/Notification";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./lib/firebase";
import { useUserStore } from "./lib/userStore";
import { useChatStore } from "./lib/chatStore";
import { set } from "firebase/database";
const App = () => {
  const {
    currentUser,
    isLoading,
    fetchUserInfo,
    setOnline,
    setOffline,
    resetUser,
  } = useUserStore();
  const { chatID, resetChat, isRecieverBlocked } = useChatStore();
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    const unSub = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchUserInfo(user?.uid);
        setOnline(user?.uid);
      } else {
        resetUser();
        resetChat();
      }
    });
    return () => {
      unSub();
    };
  }, [fetchUserInfo, isRecieverBlocked]);

  if (isLoading) return <div className="loading">Loading...</div>;
  return (
    <div className="container">
      {currentUser ? (
        <>
          <List />
          {chatID && (
            <Chat
              setShowDetail={() => setShowDetail(!showDetail)}
              showDetail={showDetail}
            />
          )}
          {chatID && showDetail && <Detail />}
        </>
      ) : (
        <Login />
      )}
      <Notification />
    </div>
  );
};

export default App;
