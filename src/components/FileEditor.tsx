"use client";

import "./fileEditor.css";
import { useState } from "react";
import {
  LexicalComposer,
  InitialConfigType,
} from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { PlainTextPlugin } from "@lexical/react/LexicalPlainTextPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";

import { $convertFromMarkdownString, TRANSFORMERS } from "@lexical/markdown";
import { CUSTOM_TRANSFORMERS } from "./MarkdownTransformers";

import {
  $getRoot,
  $createParagraphNode,
  $createTextNode,
  EditorState,
} from "lexical";

import { CodeHighlightNode, CodeNode } from "@lexical/code";
import { LinkNode } from "@lexical/link";
import { ListNode, ListItemNode } from "@lexical/list";
import { ImageNode } from "./ImageNode";
import { TableNode, TableCellNode, TableRowNode } from "@lexical/table";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";

import { HorizontalRuleNode } from "@lexical/react/LexicalHorizontalRuleNode";
import FileEditorTheme from "./FileEditorTheme";

// import {
//   ToolbarPlugin,
//   TreeViewPlugin,
//   HeadingFocusClassPlugin,
//   AutoAppendBlankLinePlugin,
//   CodeActionPlugin,
//   HeadingNavigatorPlugin,
//   TableHoverActionsPlugin,
//   TableCellResizerPlugin,
//   ImagesPlugin,
//   InlineMarkdownLinkEditPlugin,
// } from ".";

import ToolbarPlugin from "./ToolbarPlugin";
import TreeViewPlugin from "./TreeViewPlugin";
import HeadingFocusClassPlugin from "./HeadingFocusClassPlugin";
import HeadingNavigatorPlugin from "./HeadingNavigatorPlugin";
import AutoAppendBlankLinePlugin from "./AutoAppendBlankLinePlugin";
import CodeActionPlugin from "./CodeActionPlugin";
import TableHoverActionsPlugin from "./TableHoverActionsPlugin";
import TableCellResizerPlugin from "./TableCellResizerPlugin";
import ImagesPlugin from "./ImagesPlugin";
import InlineMarkdownLinkEditPlugin from "./InlineMarkdownLinkEditPlugin";

const TableActionMenuPlugin = dynamic(() => import("./TableActionMenuPlugin"), {
  ssr: false,
});

const HoverableLinkPlugin = dynamic(() => import("./HoverableLinkPlugin"), {
  ssr: false,
});

import { TablePlugin } from "@lexical/react/LexicalTablePlugin";
import { Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";
import { useFirstHeading } from "./useFirstHeading";

const onError = (error: Error) => {
  console.error(error);
};

const ALL_TRANSFORMERS = [...CUSTOM_TRANSFORMERS, ...TRANSFORMERS];

type FileEditorProps = {
  debug?: boolean;
  toolbar?: boolean;
  initialMarkdown?: string | null;
  onSave?: () => void;
};

type EditorMode = "rich-text" | "plain-text";

export function HeadingDisplay() {
  const firstHeading = useFirstHeading();

  return (
    <span className="text-white font-bold line-clamp-1">{firstHeading}</span>
  );
}

export function FileEditor({
  debug,
  toolbar,
  initialMarkdown = "",
  onSave,
}: FileEditorProps) {
  const [mode, _] = useState<EditorMode>("rich-text");
  const [anchorElem, setAnchorElem] = useState<HTMLElement | null>(null);
  const onRef = (elem: HTMLDivElement | null) => {
    setAnchorElem(elem);
  };

  const [charCount, setCharCount] = useState(0);

  if (typeof initialMarkdown !== "string") {
    return (
      <div className="min-h-40 h-full w-full p-2 border border-gray-300 bg-white text-sm animate-pulse">
        Loading...
      </div>
    );
  }

  const initialConfig: InitialConfigType = {
    namespace: "markdown-editor",
    theme: FileEditorTheme,
    onError,
    nodes: [
      HorizontalRuleNode,
      CodeNode,
      CodeHighlightNode,
      LinkNode,
      ListNode,
      ListItemNode,
      HeadingNode,
      QuoteNode,
      TableNode,
      TableCellNode,
      TableRowNode,
      ImageNode,
    ],
    editorState: () => {
      const root = $getRoot();
      root.clear();

      if (mode === "rich-text") {
        $convertFromMarkdownString(initialMarkdown, ALL_TRANSFORMERS);
      } else {
        const paragraph = $createParagraphNode();
        paragraph.append($createTextNode(initialMarkdown));
        root.append(paragraph);
      }
    },
  };

  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  function onChange(editorState: EditorState) {
    if (timeoutId) clearTimeout(timeoutId);

    timeoutId = setTimeout(() => {
      editorState.read(() => {
        const text = $getRoot().getTextContent();
        const noLineBreaks = text.replace(/\n/g, "");
        setCharCount(noLineBreaks.length);
      });
    }, 100);
  }

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className="w-full h-full flex flex-col items-center  max-h-screen overflow-y-auto overflow-x-hidden editor-scroll-container file-editor scroll-smooth editor-scrollbar">
        <div className="sticky top-0 left-0 w-full z-10">
          <div className="flex justify-between items-center py-2 px-4 bg-neutral-600 w-full">
            <HeadingDisplay />
            {onSave && (
              <button
                className="group -translate-y-0.5 cursor-pointer"
                onClick={onSave}
              >
                <div className="border border-black rounded-md translate-y-[7px] px-2 bg-white group-hover:translate-y-1.5 group-active:translate-y-2.5 transition-all flex items-center justify-center space-x-1 py-0.5 group-active:bg-neutral-300">
                  <Bookmark className="size-4" strokeWidth={1.5} />
                  <p className="text-sm">Save</p>
                </div>
                <div className="border border-black p-1 rounded-b-md bg-gray-700" />
              </button>
            )}
          </div>
          {toolbar && (
            <div className="flex flex-col w-full border-b border-neutral-200">
              <ToolbarPlugin />
            </div>
          )}
        </div>
        <div className="flex w-full bg-white">
          <div className="mx-auto flex-1 max-w-7xl p-4 w-full grid grid-cols-[1fr_200px] gap-4 ">
            <div className="flex-1 relative">
              {mode === "rich-text" ? (
                <RichTextPlugin
                  contentEditable={
                    <div ref={onRef}>
                      <ContentEditable
                        className={cn(
                          "min-h-40 h-full p-6 border border-neutral-100 shadow-lg bg-white text-sm focus:outline-none rounded-md space-y-2"
                        )}
                        aria-placeholder={"Enter some text..."}
                        placeholder={
                          <div className="absolute top-0 p-6 text-gray-300 pointer-events-none text-lg">
                            Enter some text...
                          </div>
                        }
                      />
                    </div>
                  }
                  ErrorBoundary={LexicalErrorBoundary}
                />
              ) : (
                <PlainTextPlugin
                  contentEditable={
                    <ContentEditable
                      className="min-h-40 h-full p-6 border border-neutral-100 shadow-lg bg-white text-sm focus:outline-none rounded-md space-y-2"
                      aria-placeholder={"Enter text..."}
                      placeholder={
                        <div className="absolute top-0 p-6 text-gray-300 pointer-events-none text-lg">
                          Enter text...
                        </div>
                      }
                    />
                  }
                  ErrorBoundary={LexicalErrorBoundary}
                />
              )}
              <HistoryPlugin />
              <AutoFocusPlugin />
              <MarkdownShortcutPlugin transformers={ALL_TRANSFORMERS} />
              <OnChangePlugin onChange={onChange} />
              <AutoAppendBlankLinePlugin />
              <LinkPlugin />
              <InlineMarkdownLinkEditPlugin />
              <TablePlugin />
              <CodeActionPlugin
                anchorElem={
                  typeof window === "undefined"
                    ? undefined
                    : anchorElem ?? document.body
                }
              />
              <TableHoverActionsPlugin
                anchorElem={
                  typeof window === "undefined"
                    ? undefined
                    : anchorElem ?? document.body
                }
              />
              <TableActionMenuPlugin
                anchorElem={
                  typeof window === "undefined"
                    ? undefined
                    : anchorElem ?? document.body
                }
                cellMerge
              />
              <TableCellResizerPlugin />
              <HoverableLinkPlugin />
              <HeadingFocusClassPlugin />
              <ImagesPlugin />
            </div>
            <HeadingNavigatorPlugin characters={charCount} />
            {debug && <TreeViewPlugin />}
          </div>
        </div>
      </div>
    </LexicalComposer>
  );
}
