import React from "react";
import HomePrivateComponent from "../components/homePrivateComponent";

function HomePrivate({ currentUser, onRegister, switchToLogin }) {
  return (
    <div>
      <HomePrivateComponent
        currentUser={currentUser}
        onRegister={onRegister}
        switchToLogin={switchToLogin}
      />
    </div>
  );
}

export default HomePrivate;
