import { PDFLoader } from "langchain/document_loaders/fs/pdf";



export default async function loadPDF(file: Blob) {
  const loader = new PDFLoader(file, {});
  const docs = await loader.load();
  // console.log('docs are: ', docs);
  for (let a = 0; a < docs.length; a++) {
    docs[a].pageContent = docs[a].pageContent.replace(/[\r\n]+/gm, " ")
    docs[a].metadata = {
      pageNumber: docs[a].metadata?.loc?.pageNumber,
      totalPages: docs[a].metadata?.pdf?.totalPages
    }
  }
  return docs;

  // format metadata
}