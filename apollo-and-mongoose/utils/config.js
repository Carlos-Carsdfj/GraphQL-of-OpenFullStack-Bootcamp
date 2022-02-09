const { gql, UserInputError, AuthenticationError } = require("apollo-server-express")
const Person = require("../models/person.js")
const User = require("../models/user.js")
const jwt = require("jsonwebtoken")
const { JWT_SECRET } = process.env
const { PubSub } = require('graphql-subscriptions')
const pubsub = new PubSub()
const { makeExecutableSchema } = require('@graphql-tools/schema')

const typeDefs = gql`
  enum YesNo {
    YES
    NO
  }
    type Person {
    name: String!
    phone: String
    address: Address!
    friendOf: [User!]!
    id: ID
  }
  type Address {
    street: String!
    city: String!
  }
  type User {
    username: String!
    friends: [Person]!
    id: ID!
  }
  type Token {
    value: String!
  }
  type Query {
    personCount: Int!  
    allPersons(phone: YesNo): [Person!]!
    findPerson(name: String!): [Person]
    me: User
  }
  type Mutation {
    addPerson(
      name: String!
      phone: String
      street: String!
      city: String!
    ): Person
    deleteAll: String!
    editNumber(name: String!, phone: String!): Person
    createUser(username: String!): User
    login(username: String! password: String!): Token
    addAsFriend( name: String!): User
  }
  type Subscription {
    personAdded: Person!
  }
 
`
const resolvers = {
  Query: {
    personCount: () => Person.collection.countDocuments(),
    allPersons: (root, arg) => {
      if (!arg.phone) {
        return Person.find({}).populate('friendOf').then((ps) => ps);
      }
      if (arg.phone === "YES") {
        return Person.find({ phone: { $ne: null } }).populate('friendOf').then((ps) => ps);
      }
      if (arg.phone === "NO") {
        return Person.find({ phone: null }).populate('friendOf').then((ps) => ps);
      }
    },
    findPerson: (root, arg) => {
      return Person.find({ name: arg.name }) .then((ps) => ps);
    },
    me:(root, arg, context ) => {
      console.log(context)
      return context.currentUser
    }
  },
  Person: {
    address: (root) => {
      return {
        street: root.street,
        city: root.city,
      }
    },
    friendOf: async (root) => {
      const friends = await User.find({
        friends: {
          $in: [root._id]
        } 
      })
      return friends
    }
  },

  Subscription: {
    personAdded: {
      subscribe: () => pubsub.asyncIterator(['PERSON_ADDED'])
    },
  },
  Mutation: {
    addPerson: async (root, args, context ) => {
      const person = new Person({ ...args })
      const { currentUser } = context

      if(!currentUser){
        throw new AuthenticationError('not Autenthicated')
      }

      try{
        await person.save()
        currentUser.friends = currentUser.friends.concat(person)
        await currentUser.save()
      }catch(error){
        throw new UserInputError(error.message, {
          invalidArgs: args
        })
      }
    pubsub.publish('PERSON_ADDED', { personAdded: person })
    return person
    },
    deleteAll: async()=>{
      await Person.deleteMany()
      return 'done'
    },
    editNumber: async (root, args) => {
      const person = await Person.findOne({ name: args.name })
      person.phone = args.phone;
      try{
        person.save()
      }catch(error){
        console.log(error.message)
        throw new UserInputError(error.message, {
          invalidArgs: args
        })
      }
      return person
    },
    createUser: (root, args) => {
      const user = new User({ username: args.username })

      return user.save()
        .catch(error => {
          throw new UserInputError(error.message, {
            invalidArgs: args,
          })
        })
    },
    login: async (root, args) => {
      const user = await User.findOne({ username: args.username })

      if ( !user || args.password !== 'secred' ) {
        throw new UserInputError("wrong credentials")
      }
      const userForToken = {
        username: user.username,
        id: user._id,
      }
      return { value: jwt.sign(userForToken, JWT_SECRET) }
    },
    addAsFriend: async (root, args, { currentUser })=>{

      if( !currentUser ){
        throw new AuthenticationError('not authenticated')
      }
      const nonFriendAlready = (person)=> 
        !currentUser.friends.map(f =>f._id).includes(person._id)
      const person = await Person.findOne({ name: args.name})
      if(nonFriendAlready(person)){
        currentUser.friends = currentUser.friends.concat(person)
        await currentUser.save()
      }
      
      return currentUser
    }
  },
}

const context = async ({ req }) => {
  
    const auth = req ? req.headers.authorization : null
    if (auth && auth.toLowerCase().startsWith('bearer ')) {
      const decodedToken = jwt.verify(
        auth.substring(7), JWT_SECRET
      )
      const currentUser = await User.findById(decodedToken.id).populate('friends')
      return { currentUser }
    }
  }
const schema = makeExecutableSchema({typeDefs, resolvers})
module.exports = {
  typeDefs,
  resolvers,
  context,
}
