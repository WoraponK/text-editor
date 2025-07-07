"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Input } from "../ui/input";

const FileEditor = dynamic(
  () => import("../FileEditor").then((mod) => mod.FileEditor),
  {
    ssr: false,
  }
);

const Home: React.FC = () => {
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
      <FileEditor
        toolbar
        initialMarkdown={`# Hello World
This is a test file for the File Manager component.

\`\`\`javascript
console.log("Hello World");
\`\`\`

## This is a subheading
This is some more text.

| Header 1 | Header 2 | Header 3 |
|---|---|---|
| 4 | 5 | 6 |
| 7 | 8 | 9 |

[Google](www.google.com)

![Example Image](https://www.techsmith.com/wp-content/uploads/2023/08/What-are-High-Resolution-Images.png)`}
      />
    </div>
  );
};

export default Home;
