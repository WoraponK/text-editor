"use client";

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { ElementNode } from "lexical";
import type { JSX } from "react";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useLexicalEditable } from "@lexical/react/useLexicalEditable";
import {
  $deleteTableColumnAtSelection,
  $deleteTableRowAtSelection,
  $getNodeTriplet,
  $getTableCellNodeFromLexicalNode,
  $getTableNodeFromLexicalNodeOrThrow,
  $isTableCellNode,
  $isTableSelection,
  $mergeCells,
  $unmergeCell,
  getTableElement,
  getTableObserverFromTableElement,
  TableCellNode,
  TableObserver,
} from "@lexical/table";
import { mergeRegister } from "@lexical/utils";
import {
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  COMMAND_PRIORITY_CRITICAL,
  getDOMSelection,
  SELECTION_CHANGE_COMMAND,
} from "lexical";
import * as React from "react";
import { ReactPortal, useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

function $canUnmerge(): boolean {
  const selection = $getSelection();
  if (
    ($isRangeSelection(selection) && !selection.isCollapsed()) ||
    ($isTableSelection(selection) && !selection.anchor.is(selection.focus)) ||
    (!$isRangeSelection(selection) && !$isTableSelection(selection))
  ) {
    return false;
  }
  const [cell] = $getNodeTriplet(selection.anchor);
  return cell.__colSpan > 1 || cell.__rowSpan > 1;
}

function $selectLastDescendant(node: ElementNode): void {
  const lastDescendant = node.getLastDescendant();
  if ($isTextNode(lastDescendant)) {
    lastDescendant.select();
  } else if ($isRangeSelection(lastDescendant)) {
    lastDescendant.selectEnd();
  } else if (lastDescendant !== null) {
    lastDescendant.selectNext();
  }
}

type TableCellActionMenuProps = Readonly<{
  onClose: () => void;
  tableCellNode: TableCellNode;
  cellMerge: boolean;
}>;

function TableActionMenu({
  onClose,
  tableCellNode: _tableCellNode,
  cellMerge,
}: TableCellActionMenuProps) {
  const [editor] = useLexicalComposerContext();
  const [tableCellNode, updateTableCellNode] = useState(_tableCellNode);
  const [canUnmergeCell, setCanUnmergeCell] = useState(false);

  useEffect(() => {
    return editor.registerMutationListener(
      TableCellNode,
      (nodeMutations) => {
        const nodeUpdated =
          nodeMutations.get(tableCellNode.getKey()) === "updated";

        if (nodeUpdated) {
          editor.getEditorState().read(() => {
            updateTableCellNode(tableCellNode.getLatest());
          });
        }
      },
      { skipInitialization: true }
    );
  }, [editor, tableCellNode]);

  useEffect(() => {
    editor.getEditorState().read(() => {
      setCanUnmergeCell($canUnmerge());
    });
  }, [editor]);

  const mergeTableCellsAtSelection = () => {
    editor.update(() => {
      const selection = $getSelection();
      if (!$isTableSelection(selection)) {
        return;
      }

      const nodes = selection.getNodes();
      const tableCells = nodes.filter($isTableCellNode);
      const targetCell = $mergeCells(tableCells);

      if (targetCell) {
        $selectLastDescendant(targetCell);
        onClose();
      }
    });
  };

  const unmergeTableCellsAtSelection = () => {
    editor.update(() => {
      $unmergeCell();
      onClose();
    });
  };

  const deleteTableRowAtSelection = useCallback(() => {
    editor.update(() => {
      const selection = $getSelection();

      if (!$isRangeSelection(selection)) {
        return;
      }

      try {
        const [cell] = $getNodeTriplet(selection.anchor);
        if (!cell || !$isTableCellNode(cell)) {
          return;
        }
        $deleteTableRowAtSelection();
        onClose();
      } catch (err) {
        console.warn(
          "Cannot delete row: no valid TableCellNode in selection",
          err
        );
      }
    });
  }, [editor, onClose]);

  const deleteTableColumnAtSelection = useCallback(() => {
    editor.update(() => {
      const selection = $getSelection();

      if (!$isRangeSelection(selection)) {
        return;
      }

      try {
        const [cell] = $getNodeTriplet(selection.anchor);
        if (!cell || !$isTableCellNode(cell)) {
          return;
        }
        $deleteTableColumnAtSelection();
        onClose();
      } catch (err) {
        console.warn(
          "Cannot delete column: no valid TableCellNode in selection",
          err
        );
      }
    });
  }, [editor, onClose]);

  return (
    <DropdownMenuContent className="w-48" align="start">
      {cellMerge && (
        <>
          <DropdownMenuItem onClick={mergeTableCellsAtSelection}>
            Merge cells
          </DropdownMenuItem>
          {canUnmergeCell && (
            <DropdownMenuItem onClick={unmergeTableCellsAtSelection}>
              Unmerge cells
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
        </>
      )}
      <DropdownMenuItem onClick={deleteTableRowAtSelection}>
        Delete row
      </DropdownMenuItem>
      <DropdownMenuItem onClick={deleteTableColumnAtSelection}>
        Delete column
      </DropdownMenuItem>
    </DropdownMenuContent>
  );
}

function TableCellActionMenuContainer({
  anchorElem,
  cellMerge,
}: {
  anchorElem: HTMLElement;
  cellMerge: boolean;
}): JSX.Element {
  const [editor] = useLexicalComposerContext();

  const menuButtonRef = useRef<HTMLDivElement | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [tableCellNode, setTableMenuCellNode] = useState<TableCellNode | null>(
    null
  );

  const $moveMenu = useCallback(() => {
    const menu = menuButtonRef.current;
    if (!menu) {
      setTableMenuCellNode(null);
      setIsMenuOpen(false);
      return;
    }
    const selection = $getSelection();
    const nativeSelection = getDOMSelection(editor._window);
    const activeElement = document.activeElement;

    if (selection == null) {
      setTableMenuCellNode(null);
      setIsMenuOpen(false);
      return;
    }

    const rootElement = editor.getRootElement();
    let tableObserver: TableObserver | null = null;
    let tableCellParentNodeDOM: HTMLElement | null = null;

    try {
      if (
        $isRangeSelection(selection) &&
        rootElement !== null &&
        nativeSelection !== null &&
        rootElement.contains(nativeSelection.anchorNode)
      ) {
        const anchorLexicalNode = selection.anchor.getNode();

        if (!anchorLexicalNode.isAttached()) {
          throw new Error("Anchor node not attached");
        }

        const tableCellNodeFromSelection =
          $getTableCellNodeFromLexicalNode(anchorLexicalNode);

        if (tableCellNodeFromSelection == null) {
          throw new Error("No table cell node found");
        }

        tableCellParentNodeDOM = editor.getElementByKey(
          tableCellNodeFromSelection.getKey()
        );

        if (
          tableCellParentNodeDOM == null ||
          !tableCellNodeFromSelection.isAttached()
        ) {
          throw new Error("Table cell DOM node missing or detached");
        }

        const tableNode = $getTableNodeFromLexicalNodeOrThrow(
          tableCellNodeFromSelection
        );
        const tableElement = getTableElement(
          tableNode,
          editor.getElementByKey(tableNode.getKey())
        );

        if (tableElement === null) {
          throw new Error("Expected to find tableElement in DOM");
        }

        tableObserver = getTableObserverFromTableElement(tableElement);
        setTableMenuCellNode(tableCellNodeFromSelection);
      } else if ($isTableSelection(selection)) {
        const anchorLexicalNode = selection.anchor.getNode();

        if (!anchorLexicalNode.isAttached()) {
          throw new Error("Anchor node not attached");
        }

        const anchorNode = $getTableCellNodeFromLexicalNode(anchorLexicalNode);
        if (!$isTableCellNode(anchorNode)) {
          throw new Error("Anchor node must be TableCellNode");
        }

        const tableNode = $getTableNodeFromLexicalNodeOrThrow(anchorNode);
        const tableElement = getTableElement(
          tableNode,
          editor.getElementByKey(tableNode.getKey())
        );
        if (tableElement === null) {
          throw new Error("Expected to find tableElement in DOM");
        }

        tableObserver = getTableObserverFromTableElement(tableElement);
        tableCellParentNodeDOM = editor.getElementByKey(anchorNode.getKey());

        setTableMenuCellNode(anchorNode);
      } else if (!activeElement) {
        throw new Error("No active element");
      }
    } catch {
      setTableMenuCellNode(null);
      setIsMenuOpen(false);
      return;
    }

    if (tableObserver === null || tableCellParentNodeDOM === null) {
      setTableMenuCellNode(null);
      setIsMenuOpen(false);
      return;
    }

    const enabled = !tableObserver || !tableObserver.isSelecting;

    if (enabled) {
      const tableCellRect = tableCellParentNodeDOM.getBoundingClientRect();
      const anchorRect = anchorElem.getBoundingClientRect();

      const top = tableCellRect.top - anchorRect.top;
      const left = tableCellRect.right - anchorRect.left;

      menu.style.position = "absolute";
      menu.style.top = `${top - 1}px`;
      menu.style.left = `${left - 20}px`;
    }
  }, [editor, anchorElem]);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined = undefined;
    const callback = () => {
      timeoutId = undefined;
      editor.getEditorState().read($moveMenu);
    };
    const delayedCallback = () => {
      if (timeoutId === undefined) {
        timeoutId = setTimeout(callback, 0);
      }
      return false;
    };
    return mergeRegister(
      editor.registerUpdateListener(delayedCallback),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        delayedCallback,
        COMMAND_PRIORITY_CRITICAL
      ),
      editor.registerRootListener((rootElement, prevRootElement) => {
        if (prevRootElement) {
          prevRootElement.removeEventListener("pointerup", delayedCallback);
        }
        if (rootElement) {
          rootElement.addEventListener("pointerup", delayedCallback);
          delayedCallback();
        }
      }),
      () => clearTimeout(timeoutId)
    );
  }, [editor, $moveMenu]);

  const prevTableCellDOM = useRef(tableCellNode);

  useEffect(() => {
    if (prevTableCellDOM.current !== tableCellNode) {
      setIsMenuOpen(false);
    }

    prevTableCellDOM.current = tableCellNode;
  }, [tableCellNode]);

  return (
    <div className="table-cell-action-button-container" ref={menuButtonRef}>
      {tableCellNode != null && (
        <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="size-4 rounded-full p-0 scale-90 opacity-70 transition-opacity hover:opacity-100"
            >
              <ChevronDown className="size-3" />
            </Button>
          </DropdownMenuTrigger>
          <TableActionMenu
            onClose={() => setIsMenuOpen(false)}
            tableCellNode={tableCellNode}
            cellMerge={cellMerge}
          />
        </DropdownMenu>
      )}
    </div>
  );
}

export default function TableActionMenuPlugin({
  anchorElem,
  cellMerge = false,
}: {
  anchorElem?: HTMLElement;
  cellMerge?: boolean;
}): null | ReactPortal {
  const isEditable = useLexicalEditable();

  if (typeof window === "undefined" || !anchorElem) return null;

  return createPortal(
    isEditable ? (
      <TableCellActionMenuContainer
        anchorElem={anchorElem}
        cellMerge={cellMerge}
      />
    ) : null,
    anchorElem
  );
}
