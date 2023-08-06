
enum ContentType {
  VIDEO = 'video',
  IMAGE = 'image',
  TEXT = 'text',
}

// type toReturn = {
//   type: ContentType,
//   website: string,
//   thumbnail: string,
//   mediaUrl: string,
//   title: string,
//   description: string
// }

const formatItem = (item: any) => {
  let toReturn = {
    image: (item.pagemap?.imageobject && item.pagemap.imageobject[0].url) || (item.pagemap?.cse_image && item.pagemap?.cse_image[0].src) || item.pagemap?.metatags[0]["og:image"],
    title: item.title,
    url: item.link,
    description: item.htmlSnippet,
    isVideo: !!item.pagemap?.videoobject
  };
  return toReturn;
}


const formatResponse = (response: any) => {
  // we will return the top 2
  const queries = response?.items?.map((item: any) => formatItem(item));
  const toReturn = queries.slice(0, 3);
  return toReturn;
}

export default formatResponse;