import { parse } from "node-html-parser";

export function handleHRDPage(req, res, html) {
  const root = parse(html);
  const main = root.querySelector("body");
  main.appendChild(
    parse('<script src="/injection/utils.js"></script>')
  );
  res.send(root.toString());
}