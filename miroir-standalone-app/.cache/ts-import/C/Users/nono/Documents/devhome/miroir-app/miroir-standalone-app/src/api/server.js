"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handlers = void 0;
var msw_1 = require("msw");
// import { factory, oneOf, manyOf, primaryKey } from '@mswjs/data'
// import { nanoid } from '@reduxjs/toolkit'
// import {faker} from '@faker-js/faker'
// import seedrandom from 'seedrandom'
var mock_socket_1 = require("mock-socket");
// import { setRandom } from 'txtgen'
// import { parseISO } from 'date-fns
// import * as fetch from 'node-fetch';
// const fetchJson = (...args:any[]) => import('node-fetch').then((toto:any) => {const {default: fetch} =toto;fetch(...args)});
// const entityReport = fetchJson('C:\\Users\\nono\\Documents\\devhome\\miroir-app\\miroir-standalone-app\\src\\miroir-fwk\\assets\\entities\\Report.json');
// const entityEntity = fetchJson('C:\\Users\\nono\\Documents\\devhome\\miroir-app\\miroir-standalone-app\\src\\miroir-fwk\\assets\\entities\\Entity.json');
// const reportEntityList = fetchJson('C:\\Users\\nono\\Documents\\devhome\\miroir-app\\miroir-standalone-app\\src\\miroir-fwk\\assets\\entities\\entityList.json');
var Report_json_1 = require("C:/Users/nono/Documents/devhome/miroir-app/miroir-standalone-app/src/miroir-fwk/assets/entities/Report.json");
var Entity_json_1 = require("C:/Users/nono/Documents/devhome/miroir-app/miroir-standalone-app/src/miroir-fwk/assets/entities/Entity.json");
var entityList_json_1 = require("C:/Users/nono/Documents/devhome/miroir-app/miroir-standalone-app/src/miroir-fwk/assets/reports/entityList.json");
// import entityReport from "../miroir-fwk/assets/entities/Report.json"
// import entityEntity from "../miroir-fwk/assets/entities/Entity.json"
// import reportEntityList from "../miroir-fwk/assets/reports/entityList.json"
// // const entityReport = {};
// const entityEntity = {};
// const reportEntityList = {};
var NUM_USERS = 3;
var POSTS_PER_USER = 3;
var RECENT_NOTIFICATIONS_DAYS = 7;
// Add an extra delay to all endpoints, so loading spinners show up.
// const ARTIFICIAL_DELAY_MS = 2000
var ARTIFICIAL_DELAY_MS = 100;
/* RNG setup */
// Set up a seeded random number generator, so that we get
// a consistent set of users / entries each time the page loads.
// This can be reset by deleting this localStorage value,
// or turned off by setting `useSeededRNG` to false.
// let useSeededRNG = true
// let rng = seedrandom()
// if (useSeededRNG) {
//   let randomSeedString = localStorage.getItem('randomTimestampSeed')
//   let seedDate
//   if (randomSeedString) {
//     seedDate = new Date(randomSeedString)
//   } else {
//     seedDate = new Date()
//     randomSeedString = seedDate.toISOString()
//     localStorage.setItem('randomTimestampSeed', randomSeedString)
//   }
//   rng = seedrandom(randomSeedString)
//   setRandom(rng)
//   faker.seed(seedDate.getTime())
// }
// function getRandomInt(min, max) {
//   min = Math.ceil(min)
//   max = Math.floor(max)
//   return Math.floor(rng() * (max - min + 1)) + min
// }
// const randomFromArray = (array) => {
//   const index = getRandomInt(0, array.length - 1)
//   return array[index]
// }
/* MSW Data Model Setup */
// export const db = factory({
//   user: {
//     id: primaryKey(nanoid),
//     firstName: String,
//     lastName: String,
//     name: String,
//     username: String,
//     // posts: manyOf('post'),
//   },
//   // post: {
//   //   id: primaryKey(nanoid),
//   //   title: String,
//   //   date: String,
//   //   content: String,
//   //   reactions: oneOf('reaction'),
//   //   comments: manyOf('comment'),
//   //   user: oneOf('user'),
//   // },
//   // comment: {
//   //   id: primaryKey(String),
//   //   date: String,
//   //   text: String,
//   //   post: oneOf('post'),
//   // },
//   // reaction: {
//   //   id: primaryKey(nanoid),
//   //   thumbsUp: Number,
//   //   hooray: Number,
//   //   heart: Number,
//   //   rocket: Number,
//   //   eyes: Number,
//   //   post: oneOf('post'),
//   // },
// })
// const createUserData = () => {
//   const firstName = faker.name.firstName()
//   const lastName = faker.name.lastName()
//   return {
//     firstName,
//     lastName,
//     name: `${firstName} ${lastName}`,
//     username: faker.internet.userName(),
//   }
// }
// const createPostData = (user) => {
//   return {
//     title: faker.lorem.words(),
//     date: faker.date.recent(RECENT_NOTIFICATIONS_DAYS).toISOString(),
//     user,
//     content: faker.lorem.paragraphs(),
//     reactions: db.reaction.create(),
//   }
// }
// Create an initial set of users and posts
// for (let i = 0; i < NUM_USERS; i++) {
//   const author = db.user.create(createUserData())
//   // for (let j = 0; j < POSTS_PER_USER; j++) {
//   //   const newPost = createPostData(author)
//   //   db.post.create(newPost)
//   // }
// }
var serializePost = function (post) { return (__assign(__assign({}, post), { user: post.user.id })); };
// import entityReport from "src/miroir-fwk/assets/entities/Report.json"
// import entityEntity from "src/miroir-fwk/assets/entities/Entity.json"
// import reportEntityList from "src/miroir-fwk/assets/reports/entityList.json"
/* MSW REST API Handlers */
exports.handlers = [
    // rest.get('/fakeApi/posts', function (req, res, ctx) {
    //   const posts = db.post.getAll().map(serializePost)
    //   return res(ctx.delay(ARTIFICIAL_DELAY_MS), ctx.json(posts))
    // }),
    // rest.post('/fakeApi/posts', function (req, res, ctx) {
    //   const data = req.body
    //   if (data.content === 'error') {
    //     return res(
    //       ctx.delay(ARTIFICIAL_DELAY_MS),
    //       ctx.status(500),
    //       ctx.json('Server error saving this post!')
    //     )
    //   }
    //   data.date = new Date().toISOString()
    //   const user = db.user.findFirst({ where: { id: { equals: data.user } } })
    //   data.user = user
    //   data.reactions = db.reaction.create()
    //   const post = db.post.create(data)
    //   return res(ctx.delay(ARTIFICIAL_DELAY_MS), ctx.json(serializePost(post)))
    // }),
    // rest.get('/fakeApi/posts/:postId', function (req, res, ctx) {
    //   const post = db.post.findFirst({
    //     where: { id: { equals: req.params.postId } },
    //   })
    //   return res(ctx.delay(ARTIFICIAL_DELAY_MS), ctx.json(serializePost(post)))
    // }),
    // rest.patch('/fakeApi/posts/:postId', (req, res, ctx) => {
    //   const { id, ...data } = req.body
    //   const updatedPost = db.post.update({
    //     where: { id: { equals: req.params.postId } },
    //     data,
    //   })
    //   return res(
    //     ctx.delay(ARTIFICIAL_DELAY_MS),
    //     ctx.json(serializePost(updatedPost))
    //   )
    // }),
    // rest.get('/fakeApi/posts/:postId/comments', (req, res, ctx) => {
    //   const post = db.post.findFirst({
    //     where: { id: { equals: req.params.postId } },
    //   })
    //   return res(
    //     ctx.delay(ARTIFICIAL_DELAY_MS),
    //     ctx.json({ comments: post.comments })
    //   )
    // }),
    // rest.post('/fakeApi/posts/:postId/reactions', (req, res, ctx) => {
    //   const postId = req.params.postId
    //   const reaction = req.body.reaction
    //   const post = db.post.findFirst({
    //     where: { id: { equals: postId } },
    //   })
    //   const updatedPost = db.post.update({
    //     where: { id: { equals: postId } },
    //     data: {
    //       reactions: {
    //         ...post.reactions,
    //         [reaction]: (post.reactions[reaction] += 1),
    //       },
    //     },
    //   })
    //   return res(
    //     ctx.delay(ARTIFICIAL_DELAY_MS),
    //     ctx.json(serializePost(updatedPost))
    //   )
    // }
    // ),
    // rest.get('/fakeApi/notifications', (req, res, ctx) => {
    //   const numNotifications = getRandomInt(1, 5)
    //   let notifications = generateRandomNotifications(
    //     undefined,
    //     numNotifications,
    //     db
    //   )
    //   return res(ctx.delay(ARTIFICIAL_DELAY_MS), ctx.json(notifications))
    // }),
    msw_1.rest.get('/fakeApi/Entity/all', function (req, res, ctx) {
        // return res(ctx.delay(ARTIFICIAL_DELAY_MS), ctx.json(db.user.getAll()))
        return res(ctx.delay(ARTIFICIAL_DELAY_MS), ctx.json([Report_json_1.default, Entity_json_1.default]));
    }),
    msw_1.rest.get('/fakeApi/Report/all', function (req, res, ctx) {
        // return res(ctx.delay(ARTIFICIAL_DELAY_MS), ctx.json(db.user.getAll()))
        return res(ctx.delay(ARTIFICIAL_DELAY_MS), ctx.json([entityList_json_1.default]));
    }),
];
// export const server:any = setupServer(...handlers);
exports.default = exports.handlers;
/* Mock Websocket Setup */
var socketServer = new mock_socket_1.Server('ws://localhost');
var currentSocket;
var sendMessage = function (socket, obj) {
    socket.send(JSON.stringify(obj));
};
// Allow our UI to fake the server pushing out some notifications over the websocket,
// as if other users were interacting with the system.
// const sendRandomNotifications = (socket:any, since:any) => {
//   const numNotifications = getRandomInt(1, 5)
//   const notifications = generateRandomNotifications(since, numNotifications, db)
//   sendMessage(socket, { type: 'notifications', payload: notifications })
// }
// export const forceGenerateNotifications = (since:any) => {
//   sendRandomNotifications(currentSocket, since)
// }
// socketServer.on('connection', (socket) => {
//   currentSocket = socket
//   socket.on('message', (data:any) => {
//     const message = JSON.parse(data)
//     switch (message.type) {
//       case 'notifications': {
//         const since = message.payload
//         sendRandomNotifications(socket, since)
//         break
//       }
//       default:
//         break
//     }
//   })
// })
/* Random Notifications Generation */
var notificationTemplates = [
    'poked you',
    'says hi!',
    "is glad we're friends",
    'sent you a gift',
];
// function generateRandomNotifications(since, numNotifications, db) {
//   const now = new Date()
//   let pastDate
//   if (since) {
//     pastDate = parseISO(since)
//   } else {
//     pastDate = new Date(now.valueOf())
//     pastDate.setMinutes(pastDate.getMinutes() - 15)
//   }
//   // Create N random notifications. We won't bother saving these
//   // in the DB - just generate a new batch and return them.
//   const notifications = [...Array(numNotifications)].map(() => {
//     const user = randomFromArray(db.user.getAll())
//     const template = randomFromArray(notificationTemplates)
//     return {
//       id: nanoid(),
//       date: faker.date.between(pastDate, now).toISOString(),
//       message: template,
//       user: user.id,
//     }
//   })
//   return notifications
// }
