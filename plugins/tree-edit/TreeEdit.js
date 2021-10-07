import React, { useEffect, useState, useCallback } from "react";
import SortableTree from "react-sortable-tree";
import "react-sortable-tree/style.css?raw";
import { usePaneRouter } from "@sanity/desk-tool";
import sanityClient from "part:@sanity/base/client";
import Preview from 'part:@sanity/base/preview'

import schema from "part:@sanity/base/schema"

const client = sanityClient.withConfig({
  apiVersion: "2021-09-01",
});

const TreeEdit = (props) => {
  const schemaType = schema.get(props.schemaTypeName)
  const [loading, setLoading] = useState(true);
  const [treeData, setTreeData] = useState([]);
  const {navigateIntent} = usePaneRouter()
  
  const {titleField = "title", parentRefField = "parent"} = props.options
  const queryParams = {
    type: schemaType.name, titleField, parentRefField
  }
  const query = `* [_type == $type] {_type, _id, "parent": @[$parentRefField], "title": coalesce(@[$titleField], "Untitled")}`

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      client.fetch(query, queryParams).then((categories) => {
        const findChildren = (parentId) =>
          categories
            .filter((c) => c.parent && c.parent._ref === parentId)
            .map(createNode)
            .filter((c) => !!c);

        const createNode = (category) => {
          if (categories.find((c) => c._id === `drafts.${category._id}`)) {
            return null;
          }

          return {
            title: category[titleField],
            _id: category._id,
            children: findChildren(category._id, categories),
            expanded: true,
          };
        };
        const data = categories
          .filter((c) => !c.parent)
          .map(createNode)
          .filter((c) => !!c);

        setTreeData(data);
        setLoading(false);
      });
    };
    fetchData();
    const subscription = client.observable
      .listen(query, queryParams, {
        visibility: "query",
      })
      .subscribe(fetchData);
    return () => {
      subscription.unsubscribe();
    };
  }, [schemaType.name]);

  return (
    <div style={{ height: "100%" }}>
      {!loading && !treeData.length && <h2>No documents</h2>}
      <SortableTree
        generateNodeProps={({ node }) => {

          const hasChanges = node._id.match(/drafts./);
          const id = node._id.split("drafts.").pop();

          return {
            title: <Preview
              layout={"default"}
              type={schemaType}
              value={node}
            />,
            onClick: () => navigateIntent("edit", {type: schemaType.name, id: node._id})
          };
        }}
        treeData={treeData}
        canDrop={() => !loading}
        onMoveNode={(params) => {
          console.log("moveNode", params)
          const { node, nextParentNode } = params;
          const patch = client.patch(node._id);
          if (!nextParentNode) {
            patch.unset(["parent"]);
          } else {
            patch.set({
              parent: { _type: "reference", _ref: nextParentNode._id },
            });
          }
          setLoading(true);
          patch.commit();
        }}
        onChange={setTreeData}
      />
    </div>
  );
};

export default TreeEdit;