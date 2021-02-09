const  { GraphQLDateTime } = require("graphql-iso-date");

const userResolver = require("./user.resolvers");
const taskResolver = require("./task.resolvers");

const customDateScalarResolver = {
    Date: GraphQLDateTime
}

module.exports = [
    userResolver,
    taskResolver,
    customDateScalarResolver
]    
;