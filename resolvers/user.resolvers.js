const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { combineResolvers } = require("graphql-resolvers");


const User = require("../database/models/user");
const Task = require("../database/models/task");
const { isAuthenticated } = require("./middleware");
const PubSub = require("../subscription");
const { userEvents } = require("../subscription/events");

module.exports = {
  Query: {
    user: combineResolvers(isAuthenticated, async (_, __, { email }) => {
      try {
        const user = await User.findOne({ email });
        if (!user) {
          throw new Error("User Not Found");
        }
        return user;
      } catch (error) {
        console.log(error);
        throw error;
      }
    }),
  },
  Mutation: {
    signup: async (_, { input }) => {
      try {
        const user = await User.findOne({ email: input.email });
        if (user) {
          throw new Error("Email already in use");
        }
        const hashedPassword = bcrypt.hashSync(input.password, 10);
        const newUser = new User({ ...input, password: hashedPassword });
        const result = await newUser.save();
        PubSub.publish(userEvents.USER_CREATED, {
            userCreated: result
        })
        return result;
      } catch (error) {
        console.log(error);
      }
    },
    login: async (_, { input }) => {
      try {
        const user = await User.findOne({ email: input.email });
        if (!user) {
          throw new Error("User not found");
        }
        const isPasswordValid = bcrypt.compareSync(
          input.password,
          user.password
        );
        if (!isPasswordValid) {
          throw new Error("Incorrect Password");
        }
        const secretKey = process.env.JWT_SECRET_KEY || "mykey";
        const token = jwt.sign({ email: user.email }, secretKey, {
          expiresIn: "24h",
        });
        return { token };
      } catch (error) {
        console.log(error);
        throw error;
      }
    },
  },
  Subscription: {
      userCreated: {
          subscribe: () => PubSub.asyncIterator(userEvents.USER_CREATED)
      }
  },

  User: {
    tasks: async({ id }) => {
        try {
            const tasks = await Task.find({ user: id});
            return tasks;
        } catch (error) {
            console.log(error);
            throw error;
        }
    },
  },
};
