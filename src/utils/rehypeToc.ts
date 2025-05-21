// Original code from https://github.com/pmndrs/docs/blob/main/src/components/mdx/Toc/rehypeToc.ts

import { Plugin } from "unified";
import { Node } from "hast";
import IDocToC from "../models/IDocToc.js";

const isTextNode = (
  node: Node
): node is Node & { type: "text"; value: string } => {
  return "value" in node && typeof node.value === "string";
};

const isParentNode = (node: Node): node is Node & { children: Node[] } => {
  return "children" in node && Array.isArray(node.children);
};

/**
 * Extracts the text content of a Node and its descendants.
 */
const toString = (node: Node): string => {
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
const slugify = (title: string) => title.toLowerCase().replace(/\s+|-+/g, "-");

/**
 * Extracts the ID attribute from a heading node.
 * Falls back to slugify if ID is not present.
 */
const getNodeId = (node: Node): string => {
  if (
    "properties" in node &&
    node.properties &&
    typeof node.properties === "object" &&
    "id" in node.properties &&
    typeof node.properties.id === "string"
  ) {
    return node.properties.id;
  }

  const title = toString(node);
  return slugify(title);
};

/**
 * Generates a table of contents from page headings.
 */

const isHeading = (node: Node): node is Node & { tagName: string } =>
  "tagName" in node &&
  typeof node.tagName === "string" &&
  /^h[1-6]$/.test(node.tagName);

export const rehypeToc = (target: IDocToC[] = []): Plugin => {
  return () => (root: Node) => {
    const previous: Record<number, IDocToC> = {};

    if (!isParentNode(root)) return;

    for (let i = 0; i < root.children.length; i++) {
      const node = root.children[i];

      if (isHeading(node)) {
        const level = parseInt(node.tagName[1]) - 1;

        const title = toString(node);
        const id = getNodeId(node);

        //
        // Extract content for each heading
        //

        let siblingIndex = i + 1;
        const content: string[] = [];
        let sibling: Node = root.children[siblingIndex];
        while (sibling) {
          if (isHeading(sibling)) break; // stop at the next heading

          content.push(toString(sibling));
          sibling = root.children[siblingIndex++];
        }

        const item: IDocToC = {
          id,
          level,
          url: `#${id}`,
          title,
          content: content.join(""),
          parent: previous[level - 2] ?? null,
        };
        previous[level - 1] = item;

        target.push(item);
      }
    }
  };
};
