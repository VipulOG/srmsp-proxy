import { Readable } from "stream";

export function streamToString(stream) {
  const chunks = [];
  return new Promise((resolve, reject) => {
    stream.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on("error", (err) => reject(err));
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
  });
}

export class StringToStream extends Readable {
  constructor(str) {
    super();
    this.push(str);
    this.push(null);
  }
}
