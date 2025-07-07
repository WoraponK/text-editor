"use client";

import React, { useEffect, useState } from "react";
import { Input } from "../ui/input";

type HomeProps = {
  children: React.ReactNode;
};

const Home: React.FC<HomeProps> = ({ children }) => {
  const [accessToken, setAccessToken] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("accessToken") || "";
    setAccessToken(token);
  }, []);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === "accessToken") {
        setAccessToken(event.newValue || "");
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAccessToken(value);
    localStorage.setItem("accessToken", value);
  };

  return (
    <div>
      <div className="p-4 container mx-auto">
        <p className="mb-4">
          The Insert Image feature requires an access token from{" "}
          <a className="underline text-blue-500">
            https://app.rudi.animuz.ai/.
          </a>
          <br />
          The token should be retrieved from localStorage using the key{" "}
          {`"accessToken"`}.
        </p>
        <p className="font-bold">Access Token</p>
        <Input name="accessToken" value={accessToken} onChange={handleChange} />
      </div>
      {children}
    </div>
  );
};

export default Home;
