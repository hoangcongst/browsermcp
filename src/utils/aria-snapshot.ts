import { Context } from "@/context";
import { ToolResult } from "@/tools/tool";

export async function captureAriaSnapshot(
  context: Context,
  status: string = "",
): Promise<ToolResult> {
  const urlResp = await context.sendSocketMessage("getUrl", undefined);
  const url = urlResp.url;
  const titleResp = await context.sendSocketMessage("getTitle", undefined);
  const title = titleResp.title;
  const snapshot = await context.sendSocketMessage("capture_snapshot", {});
  return {
    content: [
      {
        type: "text",
        text: `${status ? `${status}\n` : ""}
- Page URL: ${url}
- Page Title: ${title}
- Page Snapshot
\`\`\`yaml
${snapshot}
\`\`\`
`,
      },
    ],
  };
}
