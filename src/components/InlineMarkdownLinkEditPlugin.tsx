"use client";

import { useEffect } from "react";
import {
  $createTextNode,
  $getNearestNodeFromDOMNode,
  $getSelection,
  $isRangeSelection,
  TextNode,
} from "lexical";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $isLinkNode, $createLinkNode } from "@lexical/link";
import { useBlockType } from "./useBlockType";

export default function InlineMarkdownLinkEditPlugin() {
  const [editor] = useLexicalComposerContext();
  const blockType = useBlockType();

  useEffect(() => {
    const handleMouseDown = (event: MouseEvent) => {
      const domNode = event.target as HTMLElement;
      if (!domNode) return;

      editor.update(() => {
        const lexicalNode = $getNearestNodeFromDOMNode(domNode);
        if (!$isLinkNode(lexicalNode)) return;

        const label = lexicalNode.getTextContent();
        const url = lexicalNode.getURL();
        const markdown = `[${label}](${url})`;
        const textNode = $createTextNode(markdown);

        const newNode = lexicalNode.replace(textNode) as TextNode;

        const dom = editor.getRootElement();
        dom?.focus();

        newNode.select();
      });
    };

    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [editor]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Enter") {
        editor.update(() => {
          const selection = $getSelection();
          if (!$isRangeSelection(selection)) return;

          const node = selection.anchor.getNode();
          const text = node.getTextContent();

          const match = text.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
          if (!match) return;

          const [, label, url] = match;

          const linkNode = $createLinkNode(url);
          linkNode.append($createTextNode(label));

          node.replace(linkNode);
          linkNode.select();
        });
        event.preventDefault();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [editor]);

  useEffect(() => {
    if (blockType !== "link") return;

    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;

      const node = selection.anchor.getNode();
      const linkNode = $isLinkNode(node)
        ? node
        : $isLinkNode(node.getParent())
        ? node.getParent()
        : null;

      if (!linkNode) return;

      const label = linkNode.getTextContent();
      const url = $isLinkNode(linkNode) ? linkNode.getURL() : "";
      const markdown = `[${label}](${url})`;
      const textNode = $createTextNode(markdown);

      const newNode = linkNode.replace(textNode) as TextNode;

      const dom = editor.getRootElement();
      dom?.focus();
      newNode.select();
    });
  }, [blockType, editor]);

  return null;
}
