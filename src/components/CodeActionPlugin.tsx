import type { JSX } from "react";
import { $isCodeNode } from "@lexical/code";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getSelection, $isRangeSelection, isHTMLElement } from "lexical";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CopyButton } from "./CopyButton";
import { useBlockType } from "./useBlockType";

interface Position {
  top: string;
  left: string;
}

function CodeActionMenuContainer({
  anchorElem,
  blockType,
}: {
  anchorElem: HTMLElement;
  blockType: string;
}): JSX.Element | null {
  const [editor] = useLexicalComposerContext();
  const [position, setPosition] = useState<Position>({
    top: "0px",
    left: "0px",
  });
  const [codeDOMNode, setCodeDOMNode] = useState<HTMLElement | null>(null);

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) {
          setCodeDOMNode(null);
          return;
        }

        let current = selection.anchor.getNode();
        while (current && !$isCodeNode(current)) {
          current = current.getParent() as any;
        }
        const codeNode = current;

        if (codeNode && $isCodeNode(codeNode)) {
          const dom = editor.getElementByKey(codeNode.getKey());
          if (!dom || !isHTMLElement(dom)) {
            setCodeDOMNode(null);
            return;
          }

          const rect = dom.getBoundingClientRect();
          const anchorRect = anchorElem.getBoundingClientRect();

          setCodeDOMNode(dom);
          setPosition({
            top: `${rect.top - anchorRect.top}px`,
            left: `${rect.right - anchorRect.left - 8}px`,
          });
        } else {
          setCodeDOMNode(null);
        }
      });
    });
  }, [editor, anchorElem]);

  function getCodeDOMNode(): HTMLElement | null {
    return codeDOMNode;
  }

  if (!codeDOMNode || blockType !== "code") return null;

  return (
    <div
      className="absolute z-0 flex items-center gap-2 py-1 text-sm"
      style={{
        top: position.top,
        left: position.left,
        transform: "translate(-90%, -85%)",
      }}
    >
      <CopyButton editor={editor} getCodeDOMNode={getCodeDOMNode} />
    </div>
  );
}

export default function CodeActionPlugin({
  anchorElem,
}: {
  anchorElem?: HTMLElement | null;
}): React.ReactPortal | null {
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const blockType = useBlockType();

  useEffect(() => {
    if (anchorElem) {
      setContainer(anchorElem);
    } else if (typeof document !== "undefined") {
      setContainer(document.body);
    }
  }, [anchorElem]);

  if (!container) return null;

  return createPortal(
    <CodeActionMenuContainer anchorElem={container} blockType={blockType} />,
    container
  );
}
