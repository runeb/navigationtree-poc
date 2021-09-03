// /deskStructure.js
import React from "react";
import TreeEdit from "./plugins/tree-edit/TreeEdit";
import S from "@sanity/desk-tool/structure-builder";

export default () => {
  // Where we have our custom list structure
  return S.list()
    .title("Content")
    .items([
      S.listItem()
        .title("Categories")
        .child(
          S.component(TreeEdit)
            .id("tree-edit")
            .title("Edit hierarchy")
            .child((id) => {
              return S.editor()
            })
        ),
    ]);
};
