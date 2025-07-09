import { useState, useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getRoot } from "lexical";
import { $isHeadingNode } from "@lexical/rich-text";

export function useFirstHeading(): string {
  const [editor] = useLexicalComposerContext();
  const [firstHeading, setFirstHeading] = useState("Untitled");

  useEffect(() => {
    if (!editor) return;

    const unregister = editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const root = $getRoot();
        const children = root.getChildren();

        for (const child of children) {
          if ($isHeadingNode(child)) {
            const text = child.getTextContent().trim();
            setFirstHeading(text || "Untitled");
            return;
          }
        }

        setFirstHeading("Untitled");
      });
    });

    return () => {
      unregister();
    };
  }, [editor]);

  return firstHeading;
}
