require("dotenv").config();
const { ApolloServer, UserInputError, gql } = require("apollo-server");
const express = require("express");
const cors = require("cors");
const app = express();
require("./mongo");
const Person = require("./models/person.js");

const typeDefs = gql`
  enum YesNo {
    YES
    NO
  }
  type Person {
    name: String!
    phone: String
    address: Address!
    id: ID
  }
  type Address {
    street: String!
    city: String!
  }
  type Query {
    personCount: Int!
    allPersons(phone: YesNo): [Person!]!
    findPerson(name: String!): [Person]
  }
  type Mutation {
    addPerson(
      name: String!
      phone: String
      street: String!
      city: String!
    ): Person
    editNumber(name: String!, phone: String!): Person
  }
`;
const resolvers = {
  Query: {
    personCount: () => Person.collection.countDocuments(),
    allPersons: (root, arg) => {
      if (!arg.phone) {
        return Person.find({}).then((ps) => ps);
      }
      if (arg.phone === "YES") {
        return Person.find({ phone: { $ne: null } }).then((ps) => ps);
      }
      if (arg.phone === "NO") {
        return Person.find({ phone: null }).then((ps) => ps);
      }
    },
    findPerson: (root, arg) => {
      return Person.find({ name: arg.name }).then((ps) => ps);
    },
  },
  Person: {
    address: (root) => {
      return {
        street: root.street,
        city: root.city,
      };
    },
  },
  Mutation: {
    addPerson: (root, args) => {
      const person = new Person({ ...args });
      return person.save().then((ps) => ps);
    },
    editNumber: async (root, args) => {
      const person = await Person.findOne({ name: args.name });
      person.phone = args.phone;
      return person.save();
    },
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
});
server.listen().then(({ url }) => {
  console.log(`server ready at ${url}`);
});
