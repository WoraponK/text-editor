import { $isCodeNode } from "@lexical/code";
import {
  $getNearestNodeFromDOMNode,
  $getSelection,
  $setSelection,
  LexicalEditor,
} from "lexical";
import { useState } from "react";
import { Copy, CopyCheck } from "lucide-react";
import { useDebounce } from "../lib/utils";

interface Props {
  editor: LexicalEditor;
  getCodeDOMNode: () => HTMLElement | null;
}

export function CopyButton({ editor, getCodeDOMNode }: Props) {
  const [isCopyCompleted, setCopyCompleted] = useState(false);

  const removeSuccessIcon = useDebounce(() => {
    setCopyCompleted(false);
  }, 2000);

  async function handleClick(): Promise<void> {
    const codeDOMNode = getCodeDOMNode();
    if (!codeDOMNode) return;

    let content = "";

    editor.update(() => {
      const codeNode = $getNearestNodeFromDOMNode(codeDOMNode);
      if ($isCodeNode(codeNode)) {
        content = codeNode.getTextContent();
      }

      const selection = $getSelection();
      $setSelection(selection);
    });

    try {
      await navigator.clipboard.writeText(content);
      setCopyCompleted(true);
      removeSuccessIcon();
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  }

  return (
    <button
      onClick={handleClick}
      aria-label="Copy code"
      className="ml-2 rounded p-1 cursor-pointer text-neutral-400 hover:text-neutral-800 transition-colors"
    >
      {isCopyCompleted ? (
        <div className="flex items-center space-x-2">
          <CopyCheck className="size-3" />
          <p className="text-xs">Copied</p>
        </div>
      ) : (
        <div className="flex items-center space-x-2">
          <Copy className="size-3" />
          <p className="text-xs">Copy</p>
        </div>
      )}
    </button>
  );
}
