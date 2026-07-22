// import React from "react";
// import { ResultSheet } from '@/src/components/ResultSheet';

// import { renderToStaticMarkup } from "react-dom/server";
// import { getPdfCss } from "./styles";
// import { StudentResultSnapshot } from "@/app/types/result-snapshot";

// export async function renderResultSheet(snapshot: StudentResultSnapshot) {
//   const css = getPdfCss();

//   const body: any = renderToStaticMarkup(React.createElement(ResultSheet, { snapshot }));

//   return `
// <!DOCTYPE html>

// <html>

// <head>

// <meta charset="utf-8"/>

// <style>

// ${css}

// @page{
//     size:A4;
//     margin:0;
// }

// html,
// body{
//     margin:0;
//     padding:0;
//     background:white;
//     print-color-adjust:exact;
//     -webkit-print-color-adjust:exact;
// }

// body{
//     display:flex;
//     justify-content:center;
// }

// *{
//     box-sizing:border-box;
// }

// </style>

// </head>

// <body>

// ${body}

// </body>

// </html>
// `;
// }
