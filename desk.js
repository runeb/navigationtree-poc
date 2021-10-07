// /deskStructure.js
import React from "react";
import TreeEdit from "./plugins/tree-edit/TreeEdit";
import S from "@sanity/desk-tool/structure-builder";

const Tree = (typeName) => {
  return Object.assign(S.documentTypeList(typeName).serialize(), {
    type: 'component',
    component: TreeEdit,
    options: {
      titleField: "title",
      parentRefField: "parent"
    },
    menuItems: S.documentTypeList(typeName)
      .menuItems()
      .serialize().menuItems,
  });
}


export default () => {
  // Where we have our custom list structure
  return S.list()
    .title("Content")
    .items([
      S.documentTypeListItem('category'),
      S.listItem()
        .title("Categories")
        .child(
          Tree("category")
        ),
    ]);
};
