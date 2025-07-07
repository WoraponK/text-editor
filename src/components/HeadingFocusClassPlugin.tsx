import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $createParagraphNode,
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_LOW,
  KEY_BACKSPACE_COMMAND,
  $isTextNode,
} from "lexical";
import { useEffect } from "react";
import { HeadingNode } from "@lexical/rich-text";

export default function HeadingFocusClassPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) return;

        const anchorNode = selection.anchor.getNode();
        const topNode = anchorNode.getTopLevelElement();
        const domRoot = editor.getRootElement();
        if (!domRoot || !topNode) return;

        domRoot.querySelectorAll(".heading-focus").forEach((el) => {
          el.classList.remove("heading-focus");
          el.removeAttribute("data-level-marker");
        });

        if (topNode instanceof HeadingNode) {
          const dom = editor.getElementByKey(topNode.getKey());
          if (dom) {
            dom.classList.add("heading-focus");
            const level = parseInt(topNode.getTag().replace("h", ""), 10);
            dom.setAttribute("data-level-marker", "#".repeat(level));
          }
        }

        const textContent = topNode.getTextContent();

        const match = textContent.match(/^(#{1,6})(.*)$/);
        if (match) {
          const typedHashes = match[1];
          const hashCount = typedHashes.length;

          let currentLevel = 0;
          if (topNode instanceof HeadingNode) {
            currentLevel = parseInt(topNode.getTag().replace("h", ""), 10);
          }

          const newLevel = Math.min(currentLevel + hashCount, 6);

          if (newLevel !== currentLevel && topNode instanceof HeadingNode) {
            editor.update(() => {
              topNode.getWritable().setTag(`h${newLevel}` as any);
              const children = topNode.getChildren();
              if (children.length === 1 && $isTextNode(children[0])) {
                const textNode = children[0];
                const oldText = textNode.getTextContent();
                const newText = oldText.slice(hashCount).trimStart();
                textNode.setTextContent(newText);

                const selection = $getSelection();
                if ($isRangeSelection(selection)) {
                  const anchorOffset = selection.anchor.offset;
                  const focusOffset = selection.focus.offset;
                  const newAnchorOffset = Math.max(anchorOffset - hashCount, 0);
                  const newFocusOffset = Math.max(focusOffset - hashCount, 0);
                  const anchorNodeCandidate = selection.anchor.getNode();
                  const focusNodeCandidate = selection.focus.getNode();
                  const anchorTextNode = $isTextNode(anchorNodeCandidate)
                    ? anchorNodeCandidate
                    : null;
                  const focusTextNode = $isTextNode(focusNodeCandidate)
                    ? focusNodeCandidate
                    : null;

                  if (anchorTextNode && focusTextNode) {
                    selection.setTextNodeRange(
                      anchorTextNode,
                      newAnchorOffset,
                      focusTextNode,
                      newFocusOffset
                    );
                  }
                }
              }
            });
          }
        }
      });
    });
  }, [editor]);

  useEffect(() => {
    const unregisterBackspace = editor.registerCommand(
      KEY_BACKSPACE_COMMAND,
      () => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection) || !selection.isCollapsed())
          return false;

        const anchorNode = selection.anchor.getNode();
        const topNode = anchorNode.getTopLevelElement();

        if (topNode instanceof HeadingNode && selection.anchor.offset === 0) {
          const currentLevel = parseInt(topNode.getTag().replace("h", ""), 10);
          const children = topNode.getChildren();

          editor.update(() => {
            const textNode =
              children.length === 1 && $isTextNode(children[0])
                ? children[0]
                : null;
            const text = textNode?.getTextContent() ?? "";

            if (text.length === 0 && currentLevel === 1) {
              const paragraph = $createParagraphNode();
              if (textNode) paragraph.append(textNode);
              topNode.getWritable().replace(paragraph);
              return;
            }

            if (textNode && text[0] === "#") {
              const newText = text.slice(1);
              textNode.setTextContent(newText);

              const newLevel = Math.max(currentLevel - 1, 1);
              topNode.getWritable().setTag(`h${newLevel}` as any);
            } else {
              if (currentLevel === 1) {
                const paragraph = $createParagraphNode();
                if (textNode) paragraph.append(textNode);
                topNode.getWritable().replace(paragraph);
              } else {
                topNode.getWritable().setTag(`h${currentLevel - 1}` as any);
              }
            }
          });

          return true;
        }

        return false;
      },
      COMMAND_PRIORITY_LOW
    );

    return () => unregisterBackspace();
  }, [editor]);

  return null;
}
