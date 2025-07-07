import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $createParagraphNode, $createTextNode, $getRoot } from "lexical";
import { useEffect } from "react";

export default function AutoAppendBlankLinePlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const root = $getRoot();
        const children = root.getChildren();

        if (children.length === 0) return;

        const last = children[children.length - 1];
        if (!last || last.getTextContent() === "") return;

        editor.update(() => {
          const newParagraph = $createParagraphNode();
          newParagraph.append($createTextNode(""));
          root.append(newParagraph);
        });
      });
    });
  }, [editor]);

  return null;
}
