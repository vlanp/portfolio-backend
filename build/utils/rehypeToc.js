// Original code from https://github.com/pmndrs/docs/blob/main/src/components/mdx/Toc/rehypeToc.ts
const isTextNode = (node) => {
    return "value" in node && typeof node.value === "string";
};
const isParentNode = (node) => {
    return "children" in node && Array.isArray(node.children);
};
/**
 * Extracts the text content of a Node and its descendants.
 */
const toString = (node) => {
    if (isTextNode(node)) {
        return node.value;
    }
    if (isParentNode(node)) {
        return node.children.map(toString).join("");
    }
    return "";
};
/**
 * Converts a TitleCase string into a url-safe slug.
 */
const slugify = (title) => title.toLowerCase().replace(/\s+|-+/g, "-");
/**
 * Generates a table of contents from page headings.
 */
const isHeading = (node) => "tagName" in node &&
    typeof node.tagName === "string" &&
    /^h[1-6]$/.test(node.tagName);
export const rehypeToc = (target = []) => {
    return () => (root) => {
        var _a;
        const previous = {};
        if (!isParentNode(root))
            return;
        for (let i = 0; i < root.children.length; i++) {
            const node = root.children[i];
            if (isHeading(node)) {
                const level = parseInt(node.tagName[1]) - 1;
                const title = toString(node);
                const id = slugify(title);
                //
                // Extract content for each heading
                //
                let siblingIndex = i + 1;
                const content = [];
                let sibling = root.children[siblingIndex];
                while (sibling) {
                    if (isHeading(sibling))
                        break; // stop at the next heading
                    content.push(toString(sibling));
                    sibling = root.children[siblingIndex++];
                }
                const item = {
                    id,
                    level,
                    url: `#${id}`,
                    title,
                    content: content.join(""),
                    parent: (_a = previous[level - 2]) !== null && _a !== void 0 ? _a : null,
                };
                previous[level - 1] = item;
                target.push(item);
            }
        }
    };
};
