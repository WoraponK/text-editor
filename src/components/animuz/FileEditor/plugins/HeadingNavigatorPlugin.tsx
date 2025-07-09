"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $isHeadingNode } from "@lexical/rich-text";
import { $getRoot, LexicalNode, NodeKey, $isElementNode } from "lexical";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type HeadingItem = {
  key: NodeKey;
  text: string;
  level: number;
};

export default function HeadingNavigatorPlugin({
  characters,
}: {
  characters: number;
}) {
  const [editor] = useLexicalComposerContext();
  const [headings, setHeadings] = useState<HeadingItem[]>([]);
  const [activeHeadingKey, setActiveHeadingKey] = useState<NodeKey | null>(
    null
  );

  const updateHeadings = () => {
    const headings = editor.getEditorState().read(() => {
      const rootNode = $getRoot();
      const allHeadings: HeadingItem[] = [];

      const traverse = (node: LexicalNode) => {
        if ($isHeadingNode(node)) {
          allHeadings.push({
            key: node.getKey(),
            text: node.getTextContent(),
            level: parseInt(node.getTag().slice(1)) || 1,
          });
        }

        if ($isElementNode(node)) {
          node.getChildren().forEach(traverse);
        }
      };

      traverse(rootNode);

      return allHeadings;
    });

    setHeadings(headings);
  };

  useEffect(() => {
    updateHeadings();

    const unregister = editor.registerUpdateListener(() => {
      updateHeadings();
    });

    return () => unregister();
  }, [editor]);

  const scrollToHeading = (key: NodeKey) => {
    const dom = editor.getElementByKey(key) as HTMLElement | null;
    const container = document.querySelector(
      ".editor-scroll-container"
    ) as HTMLElement | null;

    if (container && dom) {
      const top = dom.offsetTop - container.offsetTop - 10;

      container.scrollTo({ top, behavior: "smooth" });
    }
  };

  useEffect(() => {
    const container = document.querySelector(
      ".editor-scroll-container"
    ) as HTMLElement | null;

    if (!container) return;

    const handleScroll = () => {
      let currentActiveKey: NodeKey | null = null;
      let closestOffset = Infinity;

      headings.forEach(({ key }) => {
        const headingElem = editor.getElementByKey(key) as HTMLElement | null;
        if (!headingElem) return;

        const offset = headingElem.offsetTop - container.scrollTop;

        if (offset >= -20 && offset < closestOffset) {
          closestOffset = offset;
          currentActiveKey = key;
        }
      });

      setActiveHeadingKey(currentActiveKey);
    };

    container.addEventListener("scroll", handleScroll);

    handleScroll();

    return () => {
      container.removeEventListener("scroll", handleScroll);
    };
  }, [headings, editor]);

  return (
    <div className="max-h-[calc(100vh-150px)] sticky top-[116px] flex flex-col justify-between space-y-2">
      <div className="overflow-auto scrollbar-thin pr-1">
        <ul className="divide-y-1 divide-neutral-200">
          {headings.map(({ key, text, level }) => (
            <li
              key={key}
              className={cn(
                "flex justify-between cursor-pointer py-3 text-xs transition-all text-wrap wrap-anywhere space-x-1.5",
                activeHeadingKey === key
                  ? "text-blue-400 !text-base"
                  : "text-neutral-500 hover:text-blue-400 hover:text-base"
              )}
              style={{ paddingLeft: (level - 1) * 8 }}
              onClick={() => {
                setActiveHeadingKey(key);
                scrollToHeading(key);
              }}
            >
              <span
                className={cn(
                  "drop-shadow-[0px_0px_2px]",
                  activeHeadingKey === key
                    ? "drop-shadow-blue-500/20"
                    : "drop-shadow-transparent hover:drop-shadow-blue-500/20"
                )}
              >
                {text || "Untitled"}
              </span>
              <div
                className={cn(
                  "min-w-1.5 rounded-full bg-blue-400 transition-all drop-shadow-[0px_0px_4px] drop-shadow-blue-500/50",
                  activeHeadingKey === key ? "opacity-100" : "opacity-0"
                )}
              ></div>
            </li>
          ))}
        </ul>
      </div>
      <div className="p-2 border border-neutral-200 flex justify-center items-center rounded-lg">
        <span className="text-sm text-neutral-400">
          {characters.toLocaleString()} Characters
        </span>
      </div>
    </div>
  );
}
