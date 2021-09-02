import React, { useEffect, useState } from "react";
import IntentButton from "part:@sanity/components/buttons/intent";
import SortableTree from "react-sortable-tree";
import "react-sortable-tree/style.css?raw";
import sanityClient from "part:@sanity/base/client";
import { useEditState } from "@sanity/react-hooks";
import { EditIcon } from "@sanity/icons";
import config from "config:tree-edit";
import { Card, Stack, Select } from "@sanity/ui";

const client = sanityClient.withConfig({
  apiVersion: "2021-09-01",
});

const TreeEdit = () => {
  const [loading, setLoading] = useState(true)
  const [treeData, setTreeData] = useState([]);
  const [type, setType] = useState(config.types[0]);

  // Configurable stuff, should be passed in to here
  const titleField = type.title;

  useEffect(() => {
    const query = `* [_type == $type]`;
    const fetchData = async () => {
      setLoading(true)
      client.fetch(query, { type: type.name }).then((categories) => {
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
        setLoading(false)
      })
    };
    fetchData();
    const subscription = client.observable
      .listen(
        query,
        { type: type.name },
        {
          visibility: "query",
        }
      )
      .subscribe(fetchData)
    return () => {
      subscription.unsubscribe();
    };
  }, [type]);

  return (
    <div style={{ height: 400 }}>
      <Card padding={4}>
        <Stack>
          <Select
            onChange={(e) => {
              setType(config.types.find((t) => t.name === e.target.value));
            }}
            fontSize={[2, 2, 3, 4]}
            padding={[3, 3, 4]}
            space={[3, 3, 4]}
          >
            {config.types.map((type) => (
              <option>{type.name}</option>
            ))}
          </Select>
        </Stack>
      </Card>
      {!treeData.length && (<h2>No documents</h2>)}
      <SortableTree
        generateNodeProps={({ node }) => {
          const hasChanges = node._id.match(/drafts./);
          const id = node._id.split("drafts.").pop();
          return {
            buttons: [
              <IntentButton
                icon={hasChanges ? EditIcon : null}
                intent="edit"
                mode="ghost"
                params={{ id, type }}
              >
                Edit
              </IntentButton>,
            ],
          };
        }}
        treeData={treeData}
        canDrop={() => !loading}
        onMoveNode={(params) => {
          console.log("move", params);
          console.log("index", params.path.pop());
          const { node, nextParentNode } = params;
          const patch = client.patch(node._id);
          if (!nextParentNode) {
            patch.unset(["parent"]);
          } else {
            patch.set({
              parent: { _type: "reference", _ref: nextParentNode._id },
            });
          }
          setLoading(true)
          patch.commit()
        }}
        onChange={setTreeData}
      />
    </div>
  );
};

export default TreeEdit;
