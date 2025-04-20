import DocViewer, { DocViewerRenderers } from "@cyntler/react-doc-viewer";

const DocRenderer = ({ url }) => {
  console.log(url);

  return (
    <div style={{ height: "100vh" }}>
      {" "}
      {/* Ensure parent container has height */}
      <DocViewer
        pluginRenderers={DocViewerRenderers}
        documents={[{ uri: url }]}
        style={{ height: "100vh" }} // Make viewer fill its parent
        config={{
          header: {
            disableHeader: true,
            disableFileName: true
          }
        }}
      />
    </div>
  );
};

export default DocRenderer;
