const fs = require("fs");
const path = require("path");
const vm = require("vm");

function usage() {
  return [
    "Usage:",
    "  node scripts/verify-static-page.js --page-cp 9ed8,8ba4,770b,677f --custom-js --custom-css",
    "  node scripts/verify-static-page.js --page-ascii page_name --custom-js --strict-page-data",
    "",
    "Use --page-cp for Chinese page names so shell commands stay ASCII-only."
  ].join("\n");
}

function readText(file) {
  if (!fs.existsSync(file)) {
    throw new Error(`Missing file: ${file}`);
  }

  return fs.readFileSync(file, "utf8");
}

function hasSuspiciousQuestionRun(value) {
  return /\?{3,}/.test(String(value));
}

function assertNoSuspiciousQuestionRun(file, text) {
  if (hasSuspiciousQuestionRun(text)) {
    throw new Error(`Suspicious question-mark run detected: ${file}`);
  }
}

function compileJs(file, text) {
  try {
    new vm.Script(text, { filename: file });
  } catch (error) {
    error.message = `${file}: ${error.message}`;
    throw error;
  }
}

function parseArgs(argv) {
  const options = {
    customCss: false,
    customJs: false,
    strictPageData: false
  };

  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];

    if (item === "--page-cp") {
      options.pageName = argv[index + 1].split(",")
        .filter(Boolean)
        .map((value) => String.fromCodePoint(parseInt(value, 16)))
        .join("");
      index += 1;
      continue;
    }

    if (item === "--page-ascii") {
      options.pageName = argv[index + 1];
      index += 1;
      continue;
    }

    if (item === "--custom-css") {
      options.customCss = true;
      continue;
    }

    if (item === "--custom-js") {
      options.customJs = true;
      continue;
    }

    if (item === "--strict-page-data") {
      options.strictPageData = true;
      continue;
    }

    if (item === "--help" || item === "-h") {
      console.log(usage());
      process.exit(0);
    }

    throw new Error(`Unknown argument: ${item}`);
  }

  if (!options.pageName) {
    throw new Error("Missing --page-cp or --page-ascii.\n" + usage());
  }

  return options;
}

function loadDocument() {
  const file = path.join("data", "document.js");
  const text = readText(file);
  let documentData;

  assertNoSuspiciousQuestionRun(file, text);
  vm.runInNewContext(text, {
    $axure: {
      loadDocument(data) {
        documentData = data;
      }
    }
  }, { filename: file });

  if (!documentData || !documentData.sitemap || !Array.isArray(documentData.sitemap.rootNodes)) {
    throw new Error("Unable to read sitemap from data/document.js.");
  }

  return documentData;
}

function loadCurrentPage(file) {
  const text = readText(file);
  let pageData;

  assertNoSuspiciousQuestionRun(file, text);
  vm.runInNewContext(text, {
    $axure: {
      loadCurrentPage(data) {
        pageData = data;
      }
    }
  }, { filename: file });

  if (!pageData || !pageData.page) {
    throw new Error(`Unable to read Axure page data: ${file}`);
  }

  return pageData;
}

function flattenNodes(nodes, result) {
  nodes.forEach((node) => {
    result.push(node);

    if (Array.isArray(node.children)) {
      flattenNodes(node.children, result);
    }
  });

  return result;
}

function verifyPage(options) {
  const warnings = [];
  const pageName = options.pageName;
  const htmlFile = `${pageName}.html`;
  const pageDataFile = path.join("files", pageName, "data.js");
  const pageStylesFile = path.join("files", pageName, "styles.css");
  const customCssFile = path.join("custom", "css", `${pageName}.css`);
  const customJsFile = path.join("custom", "js", `${pageName}.js`);

  const documentData = loadDocument();
  const pageData = loadCurrentPage(pageDataFile);
  const html = readText(htmlFile);
  const pageStyles = readText(pageStylesFile);

  [
    [htmlFile, html],
    [pageStylesFile, pageStyles]
  ].forEach(([file, text]) => assertNoSuspiciousQuestionRun(file, text));

  if (options.customCss || fs.existsSync(customCssFile)) {
    assertNoSuspiciousQuestionRun(customCssFile, readText(customCssFile));
  }

  if (options.customJs || fs.existsSync(customJsFile)) {
    const js = readText(customJsFile);
    assertNoSuspiciousQuestionRun(customJsFile, js);
    compileJs(customJsFile, js);
  }

  const nodes = flattenNodes(documentData.sitemap.rootNodes, []);
  const node = nodes.find((item) => item.url === htmlFile) ||
    nodes.find((item) => item.pageName === pageName);

  if (!node) {
    throw new Error(`Menu node not found for page: ${htmlFile}`);
  }

  if (node.url !== htmlFile) {
    throw new Error(`Menu node mismatch: ${node.id || "(no id)"}`);
  }

  if (pageData.url !== htmlFile) {
    throw new Error(`Page data url mismatch: ${pageData.url || ""}`);
  }

  const pageDataMatchesMenu = pageData.page.name === node.pageName && pageData.page.packageId === node.id;
  if (options.strictPageData && !pageDataMatchesMenu) {
    throw new Error([
      "Page data does not match sitemap node.",
      `node.id=${node.id || ""}`,
      `node.pageName=${node.pageName || ""}`,
      `node.url=${node.url || ""}`,
      `page.packageId=${pageData.page.packageId || ""}`,
      `page.name=${pageData.page.name || ""}`,
      `page.url=${pageData.url || ""}`
    ].join("\n"));
  }

  if (!options.strictPageData && !pageDataMatchesMenu) {
    warnings.push("warning: page data name/packageId does not match sitemap node; use --strict-page-data for new AI menu pages.");
  }

  [
    "resources/css/axure_rp_page.css",
    "data/styles.css",
    `files/${pageName}/styles.css`,
    "data/document.js",
    `files/${pageName}/data.js`,
    "custom/js/axure-custom-page-ready.js",
    "resources/scripts/axure/ios.js",
    '<div id="base" class="">'
  ].forEach((needle) => {
    if (!html.includes(needle)) {
      throw new Error(`Required HTML marker missing: ${needle}`);
    }
  });

  console.log([
    `verified page: ${node.pageName} (${pageName})`,
    `menu id: ${node.id}`,
    `url: ${htmlFile}`,
    ...warnings,
    "status: OK"
  ].join("\n"));
}

try {
  verifyPage(parseArgs(process.argv.slice(2)));
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
