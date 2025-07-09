import { $createCodeNode } from "@lexical/code";
import { $createListItemNode, $createListNode, ListType } from "@lexical/list";
import { $getSelection, $isRangeSelection, LexicalEditor } from "lexical";
import {
  $createHeadingNode,
  $createQuoteNode,
  HeadingTagType,
} from "@lexical/rich-text";
import { $setBlocksType } from "@lexical/selection";
import { $createParagraphNode } from "lexical";

import { debounce } from "lodash";
import { useMemo, useRef } from "react";

export function useDebounce<T extends (...args: never[]) => void>(
  fn: T,
  ms: number,
  maxWait?: number
) {
  const funcRef = useRef<T | null>(null);
  funcRef.current = fn;

  return useMemo(
    () =>
      debounce(
        (...args: Parameters<T>) => {
          if (funcRef.current) {
            funcRef.current(...args);
          }
        },
        ms,
        { maxWait }
      ),
    [ms, maxWait]
  );
}

export const formatText = (
  editor: LexicalEditor,
  blockType: string,
  tagType: HeadingTagType | "code" | "bullet" | "number" | "quote"
) => {
  editor.update(() => {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) return;

    const isActive = blockType === tagType;

    $setBlocksType(selection as any, () => {
      if (isActive) {
        return $createParagraphNode() as any;
      }

      if (tagType === "code") {
        return $createCodeNode("javascript") as any;
      }

      if (tagType === "bullet" || tagType === "number") {
        const listItem = $createListItemNode();
        listItem.append($createParagraphNode());

        const list = $createListNode(tagType as ListType);
        list.append(listItem);
        return list;
      }

      if (tagType === "quote") {
        return $createQuoteNode();
      }

      return $createHeadingNode(tagType as HeadingTagType);
    });
  });
};

export const EXECUTE_API_UPLOAD_S3 =
  "https://p0otqov6h4.execute-api.ap-southeast-1.amazonaws.com/v2/file/upload";
