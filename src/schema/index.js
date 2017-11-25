import { makeExecutableSchema } from 'graphql-tools'
import resolvers from './resolvers'

const typeDefs = `
  type User {
    id: ID!
    username: String!
    bio: String
  }

  type Course {
    id: ID!
    name: String!
  }

  type Query {
    allUsers: [User!]!
    User(
      id: ID!
    ): User

    allCourses: [Course!]!
    Course(
      id: ID!
    ): Course
  }

  type Mutation {
    createUser(
      username: String!
    ): User

    editUser(
      username: String
      bio: String
    ): User

    createCourse(
      id: ID!
      name: String!
    ): Course

    editCourse(
      id: ID!
      name: String
    ): Course
  }
`

export default makeExecutableSchema({ typeDefs, resolvers })
