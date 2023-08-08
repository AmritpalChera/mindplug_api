import { NextApiRequest } from "next";
import formidable from "formidable";
import { Writable } from "stream";
import { Buffer } from "buffer";

const formidableConfig = {
  keepExtensions: true,
  maxFileSize: 20_000_000,
  maxFieldsSize: 20_000_000,
  allowEmptyFiles: false,
  multiples: false,
};

// promisify formidable
function formidablePromise(req: NextApiRequest, opts: any) {
  return new Promise((accept, reject) => {
    const form = formidable(opts);

    form.parse(req, (err, fields, files) => {
      if (err) {
        return reject(err);
      }
      return accept({ fields, files });
    });
  });
}

const fileConsumer = (acc: any) => {
  const writable = new Writable({
    write: (chunk, _enc, next) => {
      acc.push(chunk);
      next();
    },
  });

  return writable;
};

export async function parseFileData(req: NextApiRequest) {
  const chunks: any = [];
  const formData: any = await formidablePromise(req, {
    ...formidableConfig,
    // consume this, otherwise formidable tries to save the file to disk
    fileWriteStreamHandler: () => fileConsumer(chunks),
  });

  const { fields, files } = formData;

  const fieldKeys = Object.keys(fields);
  fieldKeys.forEach((fieldKey) => fields[fieldKey] = fields[fieldKey][0]);
  if (fields.metadata) fields.metadata = JSON.parse(fields.metadata);
  if (fields.chunkSize) fields.chunkSize = parseInt(fields.chunkSize);
  const fileType = fields.type;
  if (!fileType) throw "Missing file type";

  const contents = Buffer.concat(chunks);
  const buff = Buffer.from(contents);
  

  if (fileType === 'pdf') {
    const blob = new Blob([buff]);
    return { fields, file: blob };
  } else if (fileType === 'audio') {   
    return {fields, file: buff}
  }  
  throw "Invalid file type";
}