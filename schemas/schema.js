import createSchema from 'part:@sanity/base/schema-creator'
import schemaTypes from 'all:part:@sanity/base/schema-type'

const category = {
  type: "document",
  name: "category",
  fields: [
    {
      type: "number",
      name: "sortOrder",
      hidden: true
    },
    {
      type: "string",
      name: "title"
    },
    {
      type: "reference",
      name: "parent",
      to: [{type: "category"}],
      options: {
        dataset: "other"
      }
    }
  ]
}

export default createSchema({
  name: 'default',
  types: schemaTypes.concat([
    category
  ]),
})
