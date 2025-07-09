import type { JSX } from "react";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { TreeView } from "@lexical/react/LexicalTreeView";

export default function TreeViewPlugin(): JSX.Element {
  const [editor] = useLexicalComposerContext();
  return (
    <TreeView
      viewClassName="bg-gray-800 text-white p-2 text-sm whitespace-pre-wrap max-h-[250px] relative overflow-auto"
      treeTypeButtonClassName="bg-white text-black hover:bg-gray-200 text-sm px-2"
      timeTravelPanelClassName="overflow-hidden m-auto flex"
      timeTravelButtonClassName="p-0 border-none text-sm top-[10px] right-[15px] absolute text-white hover:underline"
      timeTravelPanelSliderClassName="flex-8 p-0"
      timeTravelPanelButtonClassName="flex-1 bg-none text-white text-sm hover:underline"
      editor={editor}
    />
  );
}
