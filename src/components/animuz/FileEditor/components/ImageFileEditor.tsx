import React, { useState, useEffect, useRef } from "react";
import { useLexicalNodeSelection } from "@lexical/react/useLexicalNodeSelection";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getNodeByKey } from "lexical";
import { cn } from "@/lib/utils";

type Props = {
  src: string;
  altText: string;
  nodeKey: string;
};

export function ImageFileEditor({
  src: initialSrc,
  altText: initialAltText,
  nodeKey,
}: Props) {
  const [editor] = useLexicalComposerContext();
  const [isSelected, setSelected] = useLexicalNodeSelection(nodeKey);

  const initialMarkdown = `![${initialAltText}](${initialSrc})`;
  const [markdown, setMarkdown] = useState(initialMarkdown);
  const [parsed, setParsed] = useState(() => parseMarkdown(initialMarkdown));

  const containerRef = useRef<HTMLDivElement>(null);

  function parseMarkdown(md: string): { alt: string; src: string } {
    const match = md.match(/^!\[(.*?)\]\((.*?)\)$/);
    if (match) {
      return { alt: match[1], src: match[2] };
    }
    return { alt: initialAltText, src: initialSrc };
  }

  useEffect(() => {
    if (isSelected && containerRef.current && !containerRef.current.innerText) {
      containerRef.current.innerText = markdown;
    }
  }, [isSelected]);

  const handleInput = () => {
    const text = containerRef.current?.innerText || "";
    setMarkdown(text);
    setParsed(parseMarkdown(text));
  };

  const handleBlur = () => {
    const text = containerRef.current?.innerText || "";
    const match = text.match(/^!\[(.*?)\]\((.*?)\)$/);
    if (match) {
      const [, newAlt, newSrc] = match;
      editor.update(() => {
        const node = $getNodeByKey(nodeKey);
        if (node) {
          const imageNode = node as unknown as {
            setAltText: (alt: string) => void;
            setSrc: (src: string) => void;
          };
          imageNode.setAltText?.(newAlt);
          imageNode.setSrc?.(newSrc);
        }
      });
      setMarkdown(text);
      setParsed(parseMarkdown(text));
    } else {
      setParsed(parseMarkdown(markdown));
    }
  };

  return (
    <div className={cn("relative my-4 max-h-[300px]", isSelected && "mb-8")}>
      {isSelected && (
        <div
          ref={containerRef}
          contentEditable
          suppressContentEditableWarning
          className="mb-1.5 text-sm text-left focus:outline-none whitespace-pre-wrap break-words"
          onInput={handleInput}
          onBlur={handleBlur}
          spellCheck={false}
          onClick={(e) => e.stopPropagation()}
        />
      )}
      <img
        src={parsed.src || undefined}
        alt={parsed.alt || ""}
        className={`inline-block max-h-[300px] ${
          isSelected ? "ring-2 ring-blue-500" : ""
        }`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setSelected(true);
        }}
      />
    </div>
  );
}
