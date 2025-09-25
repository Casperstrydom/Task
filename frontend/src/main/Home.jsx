import React from "react";
import HomeComponent from "../components/homeComponent";

function Home({ currentUser, onAccessHome, switchToPrivate }) {
  return (
    <div>
      <HomeComponent
        currentUser={currentUser}
        onAccessHome={onAccessHome}
        switchToPrivate={switchToPrivate}
      />
    </div>
  );
}

export default Home;
