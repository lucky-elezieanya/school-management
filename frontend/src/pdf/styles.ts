import fs from "node:fs";
import path from "node:path";

let css: string | null = null;

export function getPdfCss(): string {
    if (css) {
        return css;
    }

    css = fs.readFileSync(
        path.join(
            process.cwd(),
            ".generated",
            "pdf.css"
        ),
        "utf8"
    );

    return css;
}