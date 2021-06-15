import { join, resolve } from "path";
import {
  ASSETS_DIR,
  COMMUNITY_DIR,
  COMMUNITY_PATH_PREFIX,
} from "../../../constants";
import {
  CreatePageFn,
  CreatePageFnArgs,
  GraphQLFunction,
} from "../../../types";
import {
  DocsContentDocs,
  DocsContentItem,
  docsGenerator,
  DocsGeneratorReturnType,
  getContent,
} from "../utils";
import { CommunityGQL, CommunityPaths, CommunityPathsArgs } from "./types";

export const createCommunityPage = (
  createPage: CreatePageFn,
  context: any,
): CreatePageFn => {
  const communityTemplate: string = resolve(
    __dirname,
    "../../../../src/views/community/index.tsx",
  );

  return (props: CreatePageFnArgs) => {
    createPage({
      ...props,
      component: communityTemplate,
      context: {
        ...context,
        ...props.context,
      },
    });
  };
};

export const prepareData = async (
  graphql: GraphQLFunction,
): Promise<DocsGeneratorReturnType> => {
  const docs = await getContent<CommunityGQL>(
    graphql,
    "/content/community/",
    `docInfo {
      id
#      type
#      fileName
    }`,
  );

  return docsGenerator<CommunityGQL>(docs, "community");
};

const extractFn = (
  doc: CommunityGQL,
  docsGroup: string,
  topicId: string,
): DocsContentDocs | null => {
  const {
    rawMarkdownBody,
    fields: {
      docInfo: { id, type, fileName },
      imagesSpec,
    },
    frontmatter: { title, type: docType },
  } = doc;

  if (!(docsGroup === type && topicId === id)) {
    return null;
  }

  const obj: DocsContentDocs = {
    order: fileName,
    title,
    source: rawMarkdownBody,
    imagesSpec,
  };

  if (docType) {
    obj.type = docType;
  }

  return obj;
};

export const prepareWebsitePaths = ({
  topic,
}: CommunityPathsArgs): CommunityPaths => {
  const assetsPath = join("/", ASSETS_DIR, COMMUNITY_DIR, ASSETS_DIR);
  const rootPagePath = join("/", COMMUNITY_PATH_PREFIX);

  if (topic.endsWith("README")) {
    topic = topic.replace("README", "");
  }
  const pagePath = join("/", COMMUNITY_PATH_PREFIX, topic);

  return {
    assetsPath,
    pagePath,
    rootPagePath,
  };
};

export const addCommunityPrefixInInternalLinks = (
  content: DocsContentItem,
): DocsContentItem => {
  const MD_LINKS_REGEX = /\[([^\[]+)\]\(([^\)]+)\)/g;

  content.docs = content.docs.map(doc => ({
    ...doc,
    source: doc.source.replace(MD_LINKS_REGEX, occurrence => {
      MD_LINKS_REGEX.lastIndex = 0;
      const href = MD_LINKS_REGEX.exec(occurrence);

      if (!href || !href[2]) {
        return occurrence;
      }

      const h = href[2];

      if (
        h.startsWith("http") ||
        h.startsWith("./assets") ||
        h.startsWith("assets") ||
        h.startsWith("#")
      ) {
        return occurrence;
      }

      occurrence = occurrence.replace(h, oldHref =>
        oldHref.startsWith("/")
          ? `/community${oldHref}`
          : `/community/${oldHref}`,
      );

      return occurrence;
    }),
  }));

  return content;
};
