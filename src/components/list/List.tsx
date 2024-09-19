import React from "react";
import "./List.css";
import ChatList from "./chatList/chatList";
import UserInfo from "./userInfo/userInfo";
const List = () => {
  return (
    <div className="List">
      <UserInfo />
      <ChatList />
    </div>
  );
};

export default List;
