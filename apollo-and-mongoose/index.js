require("dotenv").config();
const { ApolloServer, UserInputError } = require("apollo-server")
const express = require("express");
const cors = require("cors");
const app = express();
require("./mongo");
const { typeDefs, resolvers, context } = require("./utils/config.js")

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context,
});
server.listen().then(({ url }) => {
  console.log(`server ready at ${url}`);
});
