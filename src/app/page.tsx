import { FileEditor } from "@/components/FileEditor";
import HomePage from "@/components/pages/HomePage";

export default function Home() {
  return (
    <HomePage>
      <FileEditor
        toolbar
      />
    </HomePage>
  );
}
