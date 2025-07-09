import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getSelection, $isRangeSelection, $isElementNode } from "lexical";
import { useEffect, useState } from "react";
import { HeadingNode } from "@lexical/rich-text";
import { $isListNode } from "@lexical/list";
import { $isCodeNode } from "@lexical/code";

export const useBlockType = () => {
  const [editor] = useLexicalComposerContext();
  const [blockType, setBlockType] = useState("paragraph");

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) return;

        const anchorNode = selection.anchor.getNode();
        const parent = $isElementNode(anchorNode)
          ? anchorNode
          : anchorNode.getParent();

        if (!parent) return;

        const grandparent = parent.getParent?.();

        if (parent.getType() === "heading" && parent instanceof HeadingNode) {
          setBlockType(parent.getTag());
        } else if ($isCodeNode(parent)) {
          setBlockType("code");
        } else if (
          parent.getType() === "listitem" &&
          $isListNode(grandparent)
        ) {
          setBlockType(grandparent.getListType());
        } else {
          setBlockType(parent.getType());
        }
      });
    });
  }, [editor]);

  return blockType;
};
