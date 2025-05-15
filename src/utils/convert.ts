function convertRelativeToAbsolutePaths(htmlString: string, baseUrl: string) {
  baseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;

  const regex =
    /<(img|script|video|audio|source|a|link)[^>]+(src|href)=["'](?!(?:https?:\/\/|\/\/|data:|blob:))([^"']+)["'][^>]*>/gi;

  return htmlString.replace(regex, (match, tag, attr, path) => {
    let absolutePath;

    if (path.startsWith("/")) {
      const urlObj = new URL(baseUrl);
      absolutePath = `${urlObj.origin}${path}`;
    } else if (path.startsWith("./")) {
      absolutePath = `${baseUrl}/${path.substring(2)}`;
    } else if (path.startsWith("../")) {
      const urlParts = baseUrl.split("/");
      urlParts.pop();

      let pathToProcess = path;
      while (pathToProcess.startsWith("../")) {
        pathToProcess = pathToProcess.substring(3);
        urlParts.pop();
      }

      absolutePath = `${urlParts.join("/")}/${pathToProcess}`;
    } else {
      absolutePath = `${baseUrl}/${path}`;
    }

    return match.replace(`${attr}="${path}"`, `${attr}="${absolutePath}"`);
  });
}

export { convertRelativeToAbsolutePaths };
