/**
 * Codemod to replace ../Shared/... imports
 * with @components/...
 */

export default function transformer(file, api) {
  const j = api.jscodeshift;
  const root = j(file.source);

  root.find(j.ImportDeclaration).forEach((path) => {
    let importPath = path.node.source.value;

    if (importPath.includes("DeletingData")) {
      importPath = importPath.replace(
        /(\.\.\/)+DeletingData/,
        "@components/DeletingData",
      );
      path.node.source.value = importPath;
    }
  });

  return root.toSource({ quote: "double" });
}
