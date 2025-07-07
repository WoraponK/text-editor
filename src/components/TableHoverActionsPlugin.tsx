import type { JSX } from "react";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useLexicalEditable } from "@lexical/react/useLexicalEditable";
import {
  $getTableAndElementByKey,
  $getTableColumnIndexFromTableCellNode,
  $getTableRowIndexFromTableCellNode,
  $insertTableColumnAtSelection,
  $insertTableRowAtSelection,
  $isTableCellNode,
  $isTableNode,
  getTableElement,
  TableCellNode,
  TableNode,
  TableRowNode,
} from "@lexical/table";
import { $findMatchingParent, mergeRegister } from "@lexical/utils";
import { $getNearestNodeFromDOMNode, isHTMLElement, NodeKey } from "lexical";
import { useEffect, useMemo, useRef, useState } from "react";
import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

import { useDebounce } from "./utils";

const BUTTON_WIDTH_PX = 18;

const ADD_BUTTON_COMMON_CLASSES =
  "absolute z-10 flex items-center justify-center hover:opacity-50 text-gray-300 cursor-pointer transition-all border-gray-300";
const ADD_ROW_BUTTON_CLASSES = "w-full h-5 border-x border-b";
const ADD_COLUMN_BUTTON_CLASSES = "w-5 h-full border-y border-r";

function TableHoverActionsContainer({
  anchorElem,
}: {
  anchorElem: HTMLElement;
}): JSX.Element | null {
  const [editor] = useLexicalComposerContext();
  const isEditable = useLexicalEditable();
  const [isShownRow, setShownRow] = useState<boolean>(false);
  const [isShownColumn, setShownColumn] = useState<boolean>(false);
  const [shouldListenMouseMove, setShouldListenMouseMove] =
    useState<boolean>(false);
  const [position, setPosition] = useState({});
  const tableSetRef = useRef<Set<NodeKey>>(new Set());
  const tableCellDOMNodeRef = useRef<HTMLElement | null>(null);

  const debouncedOnMouseMove = useDebounce(
    (event: MouseEvent) => {
      const { isOutside, tableDOMNode } = getMouseInfo(event);

      if (isOutside) {
        setShownRow(false);
        setShownColumn(false);
        return;
      }

      if (!tableDOMNode) {
        return;
      }

      tableCellDOMNodeRef.current = tableDOMNode;

      let hoveredRowNode: TableCellNode | null = null;
      let hoveredColumnNode: TableCellNode | null = null;
      let tableDOMElement: HTMLElement | null = null;

      editor.getEditorState().read(
        () => {
          const maybeTableCell = $getNearestNodeFromDOMNode(tableDOMNode);

          if ($isTableCellNode(maybeTableCell)) {
            const table = $findMatchingParent(maybeTableCell, (node) =>
              $isTableNode(node)
            );
            if (!$isTableNode(table)) {
              return;
            }

            tableDOMElement = getTableElement(
              table,
              editor.getElementByKey(table.getKey())
            );

            if (tableDOMElement) {
              const rowCount = table.getChildrenSize();
              const colCount = (
                (table as TableNode).getChildAtIndex(0) as TableRowNode
              )?.getChildrenSize();

              const rowIndex =
                $getTableRowIndexFromTableCellNode(maybeTableCell);
              const colIndex =
                $getTableColumnIndexFromTableCellNode(maybeTableCell);

              if (rowIndex === rowCount - 1) {
                hoveredRowNode = maybeTableCell;
              } else if (colIndex === colCount - 1) {
                hoveredColumnNode = maybeTableCell;
              }
            }
          }
        },
        { editor }
      );

      if (tableDOMElement) {
        const {
          width: tableElemWidth,
          y: tableElemY,
          right: tableElemRight,
          left: tableElemLeft,
          bottom: tableElemBottom,
          height: tableElemHeight,
        } = (tableDOMElement as HTMLTableElement).getBoundingClientRect();

        const parentElement = (tableDOMElement as HTMLTableElement)
          .parentElement;
        let tableHasScroll = false;
        if (parentElement) {
          tableHasScroll =
            parentElement.scrollWidth > parentElement.clientWidth;
        }
        const { y: editorElemY, left: editorElemLeft } =
          anchorElem.getBoundingClientRect();

        if (hoveredRowNode) {
          setShownColumn(false);
          setShownRow(true);
          setPosition({
            height: BUTTON_WIDTH_PX,
            left:
              tableHasScroll && parentElement
                ? parentElement.offsetLeft
                : tableElemLeft - editorElemLeft,
            top: tableElemBottom - editorElemY,
            width:
              tableHasScroll && parentElement
                ? parentElement.offsetWidth
                : tableElemWidth,
          });
        } else if (hoveredColumnNode) {
          setShownColumn(true);
          setShownRow(false);
          setPosition({
            height: tableElemHeight,
            left: tableElemRight - editorElemLeft,
            top: tableElemY - editorElemY,
            width: BUTTON_WIDTH_PX,
          });
        }
      }
    },
    50,
    250
  );

  const tableResizeObserver = useMemo(() => {
    return new ResizeObserver(() => {
      setShownRow(false);
      setShownColumn(false);
    });
  }, []);

  useEffect(() => {
    if (!shouldListenMouseMove) {
      return;
    }

    document.addEventListener("mousemove", debouncedOnMouseMove);

    return () => {
      setShownRow(false);
      setShownColumn(false);
      debouncedOnMouseMove.cancel();
      document.removeEventListener("mousemove", debouncedOnMouseMove);
    };
  }, [shouldListenMouseMove, debouncedOnMouseMove]);

  useEffect(() => {
    return mergeRegister(
      editor.registerMutationListener(
        TableNode,
        (mutations) => {
          editor.getEditorState().read(
            () => {
              let resetObserver = false;
              for (const [key, type] of mutations) {
                switch (type) {
                  case "created": {
                    tableSetRef.current.add(key);
                    resetObserver = true;
                    break;
                  }
                  case "destroyed": {
                    tableSetRef.current.delete(key);
                    resetObserver = true;
                    break;
                  }
                  default:
                    break;
                }
              }
              if (resetObserver) {
                tableResizeObserver.disconnect();
                for (const tableKey of tableSetRef.current) {
                  const { tableElement } = $getTableAndElementByKey(tableKey);
                  if (tableElement) {
                    tableResizeObserver.observe(tableElement);
                  }
                }
                setShouldListenMouseMove(tableSetRef.current.size > 0);
              }
            },
            { editor }
          );
        },
        { skipInitialization: false }
      )
    );
  }, [editor, tableResizeObserver]);

  const insertAction = (insertRow: boolean) => {
    editor.update(() => {
      if (tableCellDOMNodeRef.current) {
        const maybeTableNode = $getNearestNodeFromDOMNode(
          tableCellDOMNodeRef.current
        );
        maybeTableNode?.selectEnd();
        if (insertRow) {
          $insertTableRowAtSelection();
          setShownRow(false);
        } else {
          $insertTableColumnAtSelection();
          setShownColumn(false);
        }
      }
    });
  };

  if (!isEditable) {
    return null;
  }

  return (
    <>
      {isShownRow && (
        <button
          className={cn(
            "table-add-row-button",
            ADD_BUTTON_COMMON_CLASSES,
            ADD_ROW_BUTTON_CLASSES
          )}
          style={{ ...position }}
          onClick={() => insertAction(true)}
        >
          <span className="text-xl pb-2">+</span>
        </button>
      )}
      {isShownColumn && (
        <button
          className={cn(
            "table-add-column-button",
            ADD_BUTTON_COMMON_CLASSES,
            ADD_COLUMN_BUTTON_CLASSES
          )}
          style={{ ...position }}
          onClick={() => insertAction(false)}
        >
          <span className="text-xl ">+</span>
        </button>
      )}
    </>
  );
}

function getMouseInfo(event: MouseEvent): {
  tableDOMNode: HTMLElement | null;
  isOutside: boolean;
} {
  const target = event.target;

  if (isHTMLElement(target)) {
    if (
      target.closest(".table-add-row-button") ||
      target.closest(".table-add-column-button")
    ) {
      return { isOutside: false, tableDOMNode: null };
    }

    const tableDOMNode = target.closest<HTMLElement>("td, th");

    const isOutside = !tableDOMNode;

    return { isOutside, tableDOMNode };
  } else {
    return { isOutside: true, tableDOMNode: null };
  }
}

export default function TableHoverActionsPlugin({
  anchorElem,
}: {
  anchorElem?: HTMLElement;
}): React.ReactPortal | null {
  const isEditable = useLexicalEditable();
  const [mountedAnchorElem, setMountedAnchorElem] =
    useState<HTMLElement | null>(null);

  useEffect(() => {
    if (typeof document !== "undefined") {
      setMountedAnchorElem(anchorElem || document.body);
    }
  }, [anchorElem]);

  if (!isEditable || !mountedAnchorElem) {
    return null;
  }

  return createPortal(
    <TableHoverActionsContainer anchorElem={mountedAnchorElem} />,
    mountedAnchorElem
  );
}
