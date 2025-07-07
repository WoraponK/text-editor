import type { EditorThemeClasses } from "lexical";

const theme: EditorThemeClasses = {
  paragraph: "text-base",
  quote: "quote-style",
  text: {
    bold: "font-bold",
    italic: "italic",
    underline: "underline",
    strikethrough: "line-through",
  },
  heading: {
    h1: "relative font-bold text-4xl heading-h1",
    h2: "relative font-bold text-3xl heading-h2",
    h3: "relative font-bold text-2xl heading-h3",
    h4: "relative font-bold text-xl heading-h4",
    h5: "relative font-bold text-base heading-h5",
    h6: "relative font-bold text-sm heading-h6",
  },
  code: "block whitespace-pre font-mono bg-neutral-100 rounded-md p-4 leading-snug border border-neutral-200 overflow-x-auto scrollbar-thin my-6",
  list: {
    nested: {
      listitem: "",
    },
    ol: "list-decimal pl-4 text-base",
    ul: "list-disc pl-4 text-base",
  },
  link: "underline text-blue-500",
  table:
    "table w-full border-collapse border border-gray-300 text-left text-sm mb-6",
  tableRow: "border-t border-gray-300",
  tableCell: "p-2 border border-gray-300 align-top",
  tableCellHeader: "p-2 border border-gray-300 bg-gray-100 align-top",
  tableCellSelected: "!bg-[#ebebeb]",
  tableCellEditing: "outline outline-2 outline-blue-400 bg-white",
  tableCellResizer:
    "absolute right-0 top-0 h-full w-1 cursor-col-resize bg-blue-500",
};

export default theme;
