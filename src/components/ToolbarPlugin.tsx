"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { mergeRegister } from "@lexical/utils";
import {
  $createTextNode,
  $getSelection,
  $insertNodes,
  $isRangeSelection,
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  FORMAT_TEXT_COMMAND,
  REDO_COMMAND,
  SELECTION_CHANGE_COMMAND,
  UNDO_COMMAND,
} from "lexical";
import {
  BoldIcon,
  ItalicIcon,
  RotateCcwIcon,
  RotateCwIcon,
  StrikethroughIcon,
  EllipsisVerticalIcon,
  CodeXmlIcon,
  ListIcon,
  ListOrderedIcon,
  QuoteIcon,
  LinkIcon,
  ImageIcon,
  SheetIcon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  Heading4Icon,
  Heading5Icon,
  Heading6Icon,
  TextIcon,
  Rows2Icon,
  Columns2Icon,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { $createLinkNode, TOGGLE_LINK_COMMAND } from "@lexical/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import ToolbarButton from "./ToolbarButton";
import { formatText } from "./utils";
import { useBlockType } from "./useBlockType";
import { HeadingTagType } from "@lexical/rich-text";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

import {
  $createTableCellNode,
  $createTableNode,
  $createTableRowNode,
} from "@lexical/table";
import { INSERT_IMAGE_COMMAND } from "./ImagesPlugin";

import { useImageUpload } from "./useEditorImageUpload";

const LowPriority = 1;

export default function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [hasTextSelected, setHasTextSelected] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkMessage, setLinkMessage] = useState("");
  const [tableRows, setTableRows] = useState(2);
  const [tableColumns, setTableColumns] = useState(2);

  const blockType = useBlockType();

  const { data, loading, upload, error } = useImageUpload<any>();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      setIsBold(selection.hasFormat("bold"));
      setIsItalic(selection.hasFormat("italic"));
      setIsStrikethrough(selection.hasFormat("strikethrough"));
      setHasTextSelected(!selection.isCollapsed());
    } else {
      setHasTextSelected(false);
    }
  }, []);

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          updateToolbar();
        });
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        (_payload, _newEditor) => {
          updateToolbar();
          return false;
        },
        LowPriority
      ),
      editor.registerCommand(
        CAN_UNDO_COMMAND,
        (payload) => {
          setCanUndo(payload);
          return false;
        },
        LowPriority
      ),
      editor.registerCommand(
        CAN_REDO_COMMAND,
        (payload) => {
          setCanRedo(payload);
          return false;
        },
        LowPriority
      )
    );
  }, [editor, updateToolbar]);

  const insertLink = useCallback(() => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        if (hasTextSelected) {
          editor.dispatchCommand(TOGGLE_LINK_COMMAND, linkUrl);
        } else {
          const linkNode = $createLinkNode(linkUrl);
          linkNode.append($createTextNode(linkMessage));
          selection.insertNodes([linkNode]);
        }
      }
    });
    setLinkUrl("");
    setLinkMessage("");
  }, [editor, hasTextSelected, linkUrl, linkMessage]);

  const insertTable = useCallback(() => {
    editor.update(() => {
      const tableNode = $createTableNode();
      tableNode.setStyle("width: fit-content");

      for (let i = 0; i < tableRows; i++) {
        const rowNode = $createTableRowNode();
        for (let j = 0; j < tableColumns; j++) {
          const cellNode = $createTableCellNode(0);
          cellNode.setStyle("min-width: 40px; min-height: 50px");
          rowNode.append(cellNode);
        }
        tableNode.append(rowNode);
      }

      const selection = $getSelection();
      if (selection) {
        $insertNodes([tableNode]);
      }
    });
  }, [editor, tableRows, tableColumns]);

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    await upload(file);
  };

  useEffect(() => {
    if (data && data.passedItems && data.passedItems.length > 0) {
      const firstItem = data.passedItems[0];
      editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
        src: firstItem.url,
        altText: firstItem.filename,
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [data, editor]);

  return (
    <div
      className="flex bg-white p-1.5 items-center justify-between space-x-8 max-lg:justify-start max-lg:overflow-x-auto"
      ref={toolbarRef}
    >
      {/* Left */}
      <div className="flex items-center">
        <ToolbarButton
          onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
          disabled={!canUndo}
          Icon={RotateCcwIcon}
          label="Undo"
        />
        <ToolbarButton
          onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
          disabled={!canRedo}
          Icon={RotateCwIcon}
          label="Redo"
        />
      </div>

      {/* Center */}
      <div className="flex space-x-2 items-center">
        <Select
          defaultValue="paragraph"
          value={blockType}
          onValueChange={(value) =>
            formatText(editor, blockType, value as HeadingTagType)
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Text" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="paragraph">
              <TextIcon />
              Normal
            </SelectItem>
            <SelectItem value="h1">
              <Heading1Icon />
              Heading 1
            </SelectItem>
            <SelectItem value="h2">
              <Heading2Icon />
              Heading 2
            </SelectItem>
            <SelectItem value="h3">
              <Heading3Icon />
              Heading 3
            </SelectItem>
            <SelectItem value="h4">
              <Heading4Icon />
              Heading 4
            </SelectItem>
            <SelectItem value="h5">
              <Heading5Icon />
              Heading 5
            </SelectItem>
            <SelectItem value="h6">
              <Heading6Icon />
              Heading 6
            </SelectItem>

            {/* Hidden Item */}
            <SelectItem value="code" className="hidden">
              <CodeXmlIcon />
              Code Block
            </SelectItem>
            <SelectItem value="bullet" className="hidden">
              <ListIcon />
              Bullet List
            </SelectItem>
            <SelectItem value="number" className="hidden">
              <ListOrderedIcon />
              Numbered List
            </SelectItem>
            <SelectItem value="quote" className="hidden">
              <QuoteIcon />
              Blockquote
            </SelectItem>
            <SelectItem value="link" className="hidden">
              <LinkIcon />
              Link
            </SelectItem>
            <SelectItem value="autolink" className="hidden">
              <LinkIcon />
              Link
            </SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center space-x-1">
          <ToolbarButton
            onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")}
            isActive={isBold}
            Icon={BoldIcon}
            label="Bold"
          />
          <ToolbarButton
            onClick={() =>
              editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")
            }
            isActive={isItalic}
            Icon={ItalicIcon}
            label="Italic"
          />
          <ToolbarButton
            onClick={() =>
              editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough")
            }
            isActive={isStrikethrough}
            Icon={StrikethroughIcon}
            label="Strikethrough"
          />
          <ToolbarButton
            onClick={() => formatText(editor, blockType, "code")}
            isActive={blockType === "code"}
            Icon={CodeXmlIcon}
            label="Code Block"
          />
          <div className="h-5">
            <Separator orientation="vertical" />
          </div>
          <ToolbarButton
            onClick={() => formatText(editor, blockType, "bullet")}
            isActive={blockType === "bullet"}
            Icon={ListIcon}
            label="Bullet List"
          />
          <ToolbarButton
            onClick={() => formatText(editor, blockType, "number")}
            isActive={blockType === "number"}
            Icon={ListOrderedIcon}
            label="Numbered List"
          />
          <div className="h-5">
            <Separator orientation="vertical" />
          </div>
          <ToolbarButton
            onClick={() => formatText(editor, blockType, "quote")}
            isActive={blockType === "quote"}
            Icon={QuoteIcon}
            label="Blockquote"
          />
          <Dialog
            onOpenChange={(open) => {
              if (!open) {
                setLinkUrl("");
                setLinkMessage("");
              }
            }}
          >
            <DialogTrigger asChild>
              <ToolbarButton
                Icon={LinkIcon}
                label="Insert Link"
                isActive={blockType === "link" || blockType === "autolink"}
              />
            </DialogTrigger>
            <DialogContent className="p-0 rounded-2xl gap-2">
              <DialogHeader className="border-b p-4 gap-0">
                <DialogTitle>Insert Link</DialogTitle>
                <DialogDescription></DialogDescription>
              </DialogHeader>
              <div className="p-4 space-y-4">
                {!hasTextSelected && (
                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Input
                      name="message"
                      placeholder="Message"
                      value={linkMessage}
                      onChange={(e) => setLinkMessage(e.target.value)}
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="link">Link</Label>
                  <Input
                    name="link"
                    placeholder="Link"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter className="border-t p-4">
                <DialogClose asChild>
                  <Button>Cancel</Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button
                    onClick={insertLink}
                    disabled={!linkUrl || (!hasTextSelected && !linkMessage)}
                    variant="outline"
                  >
                    Insert Link
                  </Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Image Upload Button */}
          <>
            <ToolbarButton
              onClick={() => fileInputRef.current?.click()}
              Icon={ImageIcon}
              label={loading ? "Uploading..." : "Insert Image"}
              disabled={loading}
              isError={!!error}
              isLoading={loading}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={onFileChange}
              style={{ display: "none" }}
            />
          </>

          <Popover>
            <PopoverTrigger asChild>
              <div>
                <ToolbarButton Icon={SheetIcon} label="Insert Table" />
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-3">
              <div className="space-y-2">
                <p className="text-sm text-neutral-700">Insert Table</p>
                <div className="grid grid-cols-7 gap-0.5">
                  {[...Array(7)].map((_, rowIndex) =>
                    [...Array(7)].map((_, colIndex) => {
                      const rows = rowIndex + 1;
                      const cols = colIndex + 1;
                      const isHighlighted =
                        rowIndex < tableRows && colIndex < tableColumns;
                      return (
                        <button
                          key={`${rows}-${cols}`}
                          className={`w-6 h-6 border inset-shadow-[0px_0px_0px_1.5px] cursor-pointer transition-colors duration-300 ${
                            isHighlighted
                              ? "inset-shadow-amber-400/50 border-amber-400"
                              : "inset-shadow-transparent"
                          }`}
                          onClick={() => {
                            setTableRows(rows);
                            setTableColumns(cols);
                          }}
                        />
                      );
                    })
                  )}
                </div>
                <div className="space-y-1">
                  <div className="text-sm flex items-center space-x-2">
                    <span className="px-2 py-1 rounded-sm border flex items-center flex-1 justify-between">
                      <Columns2Icon className="size-4 text-neutral-400" />
                      {tableColumns}
                    </span>
                    <span className="text-neutral-400">x</span>{" "}
                    <span className="px-2 py-1 rounded-sm border flex items-center flex-1 justify-between">
                      <Rows2Icon className="size-4 text-neutral-400" />
                      {tableRows}
                    </span>
                  </div>
                  <button
                    className="group -translate-y-0.5 cursor-pointer w-full"
                    onClick={() => insertTable()}
                  >
                    <div className="border border-[#4186da] rounded-sm translate-y-[7px] px-2 bg-[#50A0FF] group-hover:translate-y-1.5 group-active:translate-y-2.5 transition-all flex items-center justify-center space-x-1 py-1.5 group-active:bg-inherit/50">
                      <p className="text-sm text-white">Insert table</p>
                    </div>
                    <div className="border border-[#4186da] p-1 rounded-b-sm bg-[#50A0FF50]" />
                  </button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center">
        {/* <ToolbarButton
          onClick={() => console.log("more")}
          Icon={EllipsisVerticalIcon}
          label="More"
        /> */}
      </div>
    </div>
  );
}
