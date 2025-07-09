import { useEffect, useRef, useState, useCallback } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $findMatchingParent } from "@lexical/utils";
import { $getNearestNodeFromDOMNode, $getSelection } from "lexical";
import { $isLinkNode, LinkNode } from "@lexical/link";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Link } from "lucide-react";

const POPOVER_CLOSE_DELAY = 100;

function HoverableLinkPlugin() {
  const [editor] = useLexicalComposerContext();
  const [linkUrl, setLinkUrl] = useState<string | null>(null);
  const [linkNodeKey, setLinkNodeKey] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<
    { top: number; left: number } | undefined
  >(undefined);
  const popoverRef = useRef<HTMLDivElement>(null);
  const closePopoverTimeout = useRef<NodeJS.Timeout | null>(null);
  const isInternalInteractionRef = useRef(false);

  const clearCloseTimer = useCallback(() => {
    if (closePopoverTimeout.current) {
      clearTimeout(closePopoverTimeout.current);
      closePopoverTimeout.current = null;
    }
  }, []);

  const startCloseTimer = useCallback(() => {
    clearCloseTimer();
    closePopoverTimeout.current = setTimeout(() => {
      setIsOpen(false);
      setLinkNodeKey(null);
    }, POPOVER_CLOSE_DELAY);
  }, [clearCloseTimer]);

  useEffect(() => {
    const onMouseMove = (event: MouseEvent) => {
      const domNode = event.target as Node;
      editor.update(() => {
        const lexicalNode = $getNearestNodeFromDOMNode(domNode);
        if (!lexicalNode) {
          if (
            isOpen &&
            popoverRef.current &&
            popoverRef.current.contains(domNode)
          ) {
            clearCloseTimer();
          } else {
            if (!isInternalInteractionRef.current) {
              startCloseTimer();
            }
          }
          return;
        }

        const linkNode = $findMatchingParent(
          lexicalNode,
          $isLinkNode
        ) as LinkNode | null;

        if (linkNode) {
          clearCloseTimer();
          if (linkNode.getKey() !== linkNodeKey) {
            setLinkNodeKey(linkNode.getKey());
            setLinkUrl(linkNode.getURL());
            const domElement = editor.getElementByKey(linkNode.getKey());
            if (domElement) {
              const rect = domElement.getBoundingClientRect();
              setPosition({ top: rect.bottom + 5, left: rect.left });
              setIsOpen(true);
            }
          }
        } else {
          if (
            isOpen &&
            popoverRef.current &&
            popoverRef.current.contains(domNode)
          ) {
            clearCloseTimer();
          } else {
            if (!isInternalInteractionRef.current) {
              startCloseTimer();
            }
          }
        }
      });
    };

    const onSelectionChange = () => {
      editor.getEditorState().read(() => {
        const selection = $getSelection();
        if (selection) {
          const nodes = selection.getNodes ? selection.getNodes() : [];
          if (!nodes.some($isLinkNode)) {
            if (!isInternalInteractionRef.current) {
              startCloseTimer();
            }
          }
        }
      });
      return false;
    };

    const onRootMouseLeave = (event: MouseEvent) => {
      const relatedTarget = event.relatedTarget as Element;
      if (popoverRef.current && !popoverRef.current.contains(relatedTarget)) {
        if (!isInternalInteractionRef.current) {
          startCloseTimer();
        }
      }
    };

    const rootElement = editor.getRootElement();
    let cleanupRootElement: HTMLElement | null = null;
    if (rootElement) {
      rootElement.addEventListener("mousemove", onMouseMove);
      rootElement.addEventListener("mouseleave", onRootMouseLeave);
      cleanupRootElement = rootElement;
    }
    return () => {
      if (cleanupRootElement) {
        cleanupRootElement.removeEventListener("mousemove", onMouseMove);
        cleanupRootElement.removeEventListener("mouseleave", onRootMouseLeave);
      }
      clearCloseTimer();
    };
  }, [editor, linkNodeKey, isOpen, clearCloseTimer, startCloseTimer]);

  return (
    <Popover
      open={isOpen}
      onOpenChange={(newOpenState) => {
        if (!isInternalInteractionRef.current || !newOpenState) {
          setIsOpen(newOpenState);
          if (!newOpenState) {
            setLinkNodeKey(null);
          }
        }
        if (isInternalInteractionRef.current) {
          isInternalInteractionRef.current = false;
        }
      }}
    >
      <PopoverTrigger asChild>
        <div
          style={{ ...position, position: "fixed", pointerEvents: "none" }}
        />
      </PopoverTrigger>
      <PopoverContent
        ref={popoverRef}
        className="w-48 rounded-lg p-2"
        onMouseEnter={clearCloseTimer}
        onMouseLeave={startCloseTimer}
      >
        <p className="text-sm truncate max-w-64">
          <a
            href={linkUrl || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline flex items-center space-x-1"
          >
            <Link className="size-3" />
            <span>{linkUrl}</span>
          </a>
        </p>
      </PopoverContent>
    </Popover>
  );
}

export default HoverableLinkPlugin;
